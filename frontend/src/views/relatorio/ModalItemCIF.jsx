import { useEffect, useMemo, useState } from 'react'
import './ModalItemCIF.css'
import {
    obterPrefixoCIF,
    obterRotuloQualificador1,
    obterRotuloQualificador2,
    obterRotuloQualificador3,
    obterRotuloQualificador4,
    obterCamposVisiveis,
    QUALIFICADOR_0_A_4_8_9,
    OPCOES_NATUREZA_ESTRUTURA,
    OPCOES_LOCALIZACAO_ESTRUTURA,
} from '../../utils/regrascif'

const CATEGORY_PREFIX = {
    b: 'FUNCAO',
    s: 'ESTRUTURA',
    d: 'ACTIVIDADE_PARTICIPACAO',
    e: 'FACTOR_AMBIENTAL',
}

const TITLE_PREFIX = {
    b: 'Função do Corpo',
    s: 'Estrutura do Corpo',
    d: 'Atividade e Participação',
    e: 'Fator Ambiental',
}

const EMPTY_FORM = {
    codigoCIF: '',
    descricao: '',
    categoria: '',
    nivel: '',
    qualificador1: '',
    tipoQualificador1: '',
    qualificador2: '',
    qualificador3: '',
    qualificador4: '',
    observacao: '',
    modoAvancado: false,
}

function normalizeItem(item = {}, currentType = 'b') {
    const temAvancado =
        (item.qualificador3 !== null && item.qualificador3 !== undefined && item.qualificador3 !== '') ||
        (item.qualificador4 !== null && item.qualificador4 !== undefined && item.qualificador4 !== '')

    return {
        codigoCIF: item.codigoCIF || '',
        descricao: item.descricao || '',
        categoria: item.categoria || CATEGORY_PREFIX[currentType] || '',
        nivel: item.nivel ?? '',
        qualificador1: item.qualificador1 ?? '',
        tipoQualificador1: item.tipoQualificador1 || '',
        qualificador2: item.qualificador2 ?? '',
        qualificador3: item.qualificador3 ?? '',
        qualificador4: item.qualificador4 ?? '',
        observacao: item.observacao || '',
        modoAvancado: item.modoAvancado || temAvancado || false,
    }
}

function toNullableInt(value) {
    if (value === '' || value === null || value === undefined) return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
}

function QualificadorSelect({ id, label, value, onChange, opcoes }) {
    return (
        <div className="modal-item-cif__field">
            <label htmlFor={id}>{label}</label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            >
                <option value="">Selecione</option>
                {opcoes.map((op) => (
                    <option key={op.valor} value={op.valor}>
                        {op.rotulo}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default function ModalItemCIF({
    isOpen,
    onClose,
    onSave,
    item = null,
    currentType = 'b',
    references = [],
    isLoading = false,
}) {
    const [form, setForm] = useState(EMPTY_FORM)
    const [searchTerm, setSearchTerm] = useState('')
    const [showOptions, setShowOptions] = useState(false)

    const campos = useMemo(() => {
        const formComPrefixo = form.codigoCIF
            ? form
            : { ...form, codigoCIF: currentType }
        return obterCamposVisiveis(formComPrefixo)
    }, [form, currentType])

    const filteredReferences = useMemo(() => {
        const base = references.filter((ref) =>
            String(ref.codigo || '').toLowerCase().startsWith(String(currentType || '').toLowerCase())
        )
        const term = searchTerm.trim().toLowerCase()
        if (!term) return base
        return base.filter((ref) => {
            const codigo = String(ref.codigo || '').toLowerCase()
            const descricao = String(ref.descricao || '').toLowerCase()
            return codigo.includes(term) || descricao.includes(term)
        })
    }, [references, currentType, searchTerm])

    useEffect(() => {
        if (!isOpen) return
        const normalized = item
            ? normalizeItem(item, currentType)
            : normalizeItem({}, currentType)
        setForm(normalized)
        setSearchTerm(
            normalized.codigoCIF
                ? `${normalized.codigoCIF} - ${normalized.descricao || ''}`
                : ''
        )
        setShowOptions(false)
    }, [isOpen, item, currentType])

    if (!isOpen) return null

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleReferenceChange = (codigo) => {
        const selected = references.find((ref) => ref.codigo === codigo)
        setForm((prev) => ({
            ...prev,
            codigoCIF: codigo,
            descricao: selected?.descricao || '',
            categoria: selected?.categoria || CATEGORY_PREFIX[currentType] || prev.categoria || '',
            nivel: selected?.nivel ?? prev.nivel ?? '',
        }))
        setSearchTerm(selected ? `${selected.codigo} - ${selected.descricao}` : codigo)
        setShowOptions(false)
    }

    const handleSubmit = () => {
        if (!form.codigoCIF) return
        if (!form.categoria) return
        onSave?.({
            codigoCIF: form.codigoCIF,
            descricao: form.descricao?.trim() || undefined,
            categoria: form.categoria,
            nivel: toNullableInt(form.nivel),
            qualificador1: toNullableInt(form.qualificador1),
            tipoQualificador1: form.tipoQualificador1 || undefined,
            qualificador2: toNullableInt(form.qualificador2),
            qualificador3: toNullableInt(form.qualificador3),
            qualificador4: toNullableInt(form.qualificador4),
            observacao: form.observacao?.trim() || undefined,
            modoAvancado: form.modoAvancado,
        })
    }

    return (
        <div className="modal-item-cif__overlay" onClick={onClose}>
            <div className="modal-item-cif" onClick={(e) => e.stopPropagation()}>
                <div className="modal-item-cif__header">
                    <div>
                        <h3>{item ? 'Editar item CIF' : 'Adicionar item CIF'}</h3>
                        <p>{TITLE_PREFIX[currentType] || 'Item CIF'}</p>
                    </div>
                    <button
                        type="button"
                        className="modal-item-cif__close"
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        ×
                    </button>
                </div>

                <div className="modal-item-cif__form">
                    <div className="modal-item-cif__grid">

                        {/* Autocomplete de código */}
                        <div className="modal-item-cif__field modal-item-cif__field--full">
                            <label htmlFor="codigoCIFBusca">Código CIF</label>
                            <div className="modal-item-cif__autocomplete">
                                <input
                                    id="codigoCIFBusca"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setShowOptions(true)
                                        handleChange('codigoCIF', '')
                                    }}
                                    onFocus={() => setShowOptions(true)}
                                    placeholder="Digite o código ou a descrição"
                                    autoComplete="off"
                                    disabled={isLoading}
                                />
                                {showOptions && (
                                    <div className="modal-item-cif__options">
                                        {isLoading ? (
                                            <div className="modal-item-cif__option modal-item-cif__option--empty">
                                                A carregar...
                                            </div>
                                        ) : filteredReferences.length > 0 ? (
                                            filteredReferences.map((ref) => (
                                                <button
                                                    type="button"
                                                    key={ref.codigo}
                                                    className="modal-item-cif__option"
                                                    onClick={() => handleReferenceChange(ref.codigo)}
                                                >
                                                    <strong>{ref.codigo}</strong> - {ref.descricao}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="modal-item-cif__option modal-item-cif__option--empty">
                                                Nenhum código encontrado
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Descrição */}
                        <div className="modal-item-cif__field modal-item-cif__field--full">
                            <label htmlFor="descricao">Descrição</label>
                            <input
                                id="descricao"
                                type="text"
                                value={form.descricao}
                                onChange={(e) => handleChange('descricao', e.target.value)}
                                placeholder="Descrição do item"
                            />
                        </div>

                        {/* Categoria (readonly) */}
                        <div className="modal-item-cif__field">
                            <label htmlFor="categoria">Categoria</label>
                            <input id="categoria" type="text" value={form.categoria} readOnly />
                        </div>

                        {/* Nível (readonly se veio da referência) */}
                        <div className="modal-item-cif__field">
                            <label htmlFor="nivel">Nível</label>
                            <input
                                id="nivel"
                                type="number"
                                min="0"
                                value={form.nivel}
                                onChange={(e) => handleChange('nivel', e.target.value)}
                                placeholder="Ex.: 2"
                            />
                        </div>

                        {/* Qualificador 1 — sempre visível se há prefixo */}
                        {campos.exibirQualificador1 && (
                            <QualificadorSelect
                                id="qualificador1"
                                label={obterRotuloQualificador1(form)}
                                value={form.qualificador1}
                                onChange={(v) => handleChange('qualificador1', v)}
                                opcoes={QUALIFICADOR_0_A_4_8_9}
                            />
                        )}

                        {/* Tipo qualificador 1 — só para factores ambientais */}
                        {campos.exibirTipoQualificador1 && (
                            <div className="modal-item-cif__field">
                                <label htmlFor="tipoQualificador1">Tipo</label>
                                <select
                                    id="tipoQualificador1"
                                    value={form.tipoQualificador1}
                                    onChange={(e) => handleChange('tipoQualificador1', e.target.value)}
                                >
                                    <option value="">Selecione</option>
                                    <option value="FACILITADOR">Facilitador (+)</option>
                                    <option value="BARREIRA">Barreira (.)</option>
                                </select>
                            </div>
                        )}

                        {/* Qualificador 2 — para 's' (natureza) e 'd' (capacidade) */}
                        {campos.exibirQualificador2 && (
                            <QualificadorSelect
                                id="qualificador2"
                                label={obterRotuloQualificador2(form)}
                                value={form.qualificador2}
                                onChange={(v) => handleChange('qualificador2', v)}
                                opcoes={
                                    obterPrefixoCIF(form.codigoCIF) === 's'
                                        ? OPCOES_NATUREZA_ESTRUTURA
                                        : QUALIFICADOR_0_A_4_8_9
                                }
                            />
                        )}

                        {/* Modo avançado — só para 'd' */}
                        {campos.exibirModoAvancado && (
                            <div className="modal-item-cif__field modal-item-cif__field--full">
                                <label className="modal-item-cif__checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={form.modoAvancado}
                                        onChange={(e) => handleChange('modoAvancado', e.target.checked)}
                                    />
                                    Modo avançado (capacidade com/sem auxílio)
                                </label>
                            </div>
                        )}

                        {/* Qualificador 3 — para 's' (localização) ou 'd' avançado */}
                        {campos.exibirQualificador3 && (
                            <QualificadorSelect
                                id="qualificador3"
                                label={obterRotuloQualificador3(form)}
                                value={form.qualificador3}
                                onChange={(v) => handleChange('qualificador3', v)}
                                opcoes={
                                    obterPrefixoCIF(form.codigoCIF) === 's'
                                        ? OPCOES_LOCALIZACAO_ESTRUTURA
                                        : QUALIFICADOR_0_A_4_8_9
                                }
                            />
                        )}

                        {/* Qualificador 4 — só para 'd' avançado */}
                        {campos.exibirQualificador4 && (
                            <QualificadorSelect
                                id="qualificador4"
                                label={obterRotuloQualificador4(form)}
                                value={form.qualificador4}
                                onChange={(v) => handleChange('qualificador4', v)}
                                opcoes={QUALIFICADOR_0_A_4_8_9}
                            />
                        )}

                        {/* Observação */}
                        {campos.exibirObservacao && (
                            <div className="modal-item-cif__field modal-item-cif__field--full">
                                <label htmlFor="observacao">Observação</label>
                                <textarea
                                    id="observacao"
                                    rows="3"
                                    value={form.observacao}
                                    onChange={(e) => handleChange('observacao', e.target.value)}
                                    placeholder="Observações sobre o item"
                                />
                            </div>
                        )}
                    </div>

                    <div className="modal-item-cif__actions">
                        <button
                            type="button"
                            className="modal-item-cif__button modal-item-cif__button--secondary"
                            onClick={onClose}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="modal-item-cif__button modal-item-cif__button--primary"
                            onClick={handleSubmit}
                            disabled={!form.codigoCIF}
                        >
                            {item ? 'Salvar alterações' : 'Adicionar item'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}