import { ArrowLeft, ArrowRightLeft } from 'lucide-react'
import Layout from '../../components/Layout'
import useTransferenciaCoordenadorViewModel from '../../viewmodels/useTransferenciaCoordenadorViewModel'
import './TransferenciaCoordenador.css'

function TransferenciaCoordenador() {
const {
  professores,
  novoCoordenadorId,
  setNovoCoordenadorId,
  coordenadorId,
  carregando,
  enviando,
  erro,
  formatarProfessor,
  transferirCoordenador,
  voltar,
} = useTransferenciaCoordenadorViewModel()

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
          <select
            className="form-input"
            value={novoCoordenadorId}
            onChange={(e) => setNovoCoordenadorId(e.target.value)}
            disabled={carregando || enviando}
          >
            <option value="">
              {carregando ? 'Carregando professores...' : 'Selecione um professor'}
            </option>
            {professores.map((professor) => {
              const isCoordenadorAtual = String(professor.fisioterapeutaId) === String(coordenadorId)
              return (
                <option
                  key={professor.fisioterapeutaId}
                  value={professor.fisioterapeutaId}
                  disabled={isCoordenadorAtual}
                >
                  {formatarProfessor(professor)}{isCoordenadorAtual ? ' (voce)' : ''}
                </option>
              )
            })}
          </select>
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
