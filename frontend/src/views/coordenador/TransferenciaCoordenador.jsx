import { useState } from 'react'
import { ArrowLeft, ArrowRightLeft } from 'lucide-react'
import Layout from '../../components/Layout'
import useTransferenciaCoordenadorViewModel from '../../viewmodels/useTransferenciaCoordenadorViewModel'
import './TransferenciaCoordenador.css'

function TransferenciaCoordenador() {
  const {
    professores,
    novoCoordenador,
    novoCoordenadorId,
    setNovoCoordenadorId,
    totalProfessores,
    temMaisProfessores,
    carregarMaisProfessores,
    carregando,
    carregandoMais,
    enviando,
    erro,
    formatarProfessor,
    transferirCoordenador,
    voltar,
  } = useTransferenciaCoordenadorViewModel()
  const [selectAberto, setSelectAberto] = useState(false)

  let textoPlaceholder = 'Selecione um professor'

  if (carregando) {
    textoPlaceholder = 'Carregando professores...'
  } else if (totalProfessores === 0) {
    textoPlaceholder = 'Nenhum professor disponivel'
  }

  const textoSelecionado = novoCoordenador ? formatarProfessor(novoCoordenador) : textoPlaceholder

  function selecionarProfessor(professor) {
    setNovoCoordenadorId(String(professor.fisioterapeutaId))
    setSelectAberto(false)
  }

  function alternarSelect() {
    if (carregando || enviando || totalProfessores === 0) return
    setSelectAberto((aberto) => !aberto)
  }

  function fecharSelectAoSair(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setSelectAberto(false)
    }
  }

  function carregarAoRolar(e) {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    const chegouAoFim = scrollTop + clientHeight >= scrollHeight - 24

    if (chegouAoFim && temMaisProfessores) {
      carregarMaisProfessores()
    }
  }

  return (
    <Layout>
      <div className="content-section">
        <div className="transferencia-page-header">
          <button type="button" className="transferencia-voltar" onClick={voltar}>
            <ArrowLeft size={16} />
            Voltar
          </button>
          <div>
            <h1 className="transferencia-titulo">Transferencia Coordenador</h1>
            <p className="transferencia-subtitulo">Selecione o professor que recebera o cargo</p>
          </div>
        </div>

        <div className="transferencia-divisor" />

        <form className="transferencia-form" onSubmit={transferirCoordenador}>
          <div className="transferencia-info">
            <ArrowRightLeft size={20} />
            <span>A transferencia remove seu acesso de coordenador e atribui o cargo ao professor selecionado.</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Novo coordenador <span className="campo-obrigatorio">*</span>
            </label>
            <div
              className="transferencia-select"
              onBlur={fecharSelectAoSair}
            >
              <button
                type="button"
                className={`transferencia-select-trigger ${!novoCoordenadorId ? 'transferencia-select-trigger--placeholder' : ''}`}
                onClick={alternarSelect}
                disabled={carregando || enviando || totalProfessores === 0}
                aria-expanded={selectAberto}
              >
                <span>{textoSelecionado}</span>
              </button>
              {selectAberto && (
                <div className="transferencia-select-menu" onScroll={carregarAoRolar}>
                  {professores.map((professor) => (
                    <button
                      type="button"
                      key={professor.fisioterapeutaId}
                      className={`transferencia-select-option ${
                        String(professor.fisioterapeutaId) === novoCoordenadorId
                          ? 'transferencia-select-option--selected'
                          : ''
                      }`}
                      onClick={() => selecionarProfessor(professor)}
                    >
                      {formatarProfessor(professor)}
                    </button>
                  ))}
                  {carregandoMais && (
                    <div className="transferencia-select-status">Carregando mais...</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {erro && <p className="form-error">{erro}</p>}

          <div className="transferencia-acoes">
            <button
              type="submit"
              className="btn-transferencia-primary"
              disabled={carregando || enviando || !novoCoordenadorId}
            >
              {enviando ? 'Transferindo...' : 'Transferir coordenador'}
            </button>
            <button type="button" className="btn-transferencia-secondary" onClick={voltar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default TransferenciaCoordenador
