import { describe, it, expect } from 'vitest'
import { ativarAutoResizeTextboxes } from '../../utils/docx.utils'

describe('ativarAutoResizeTextboxes', () => {
  it('nao deve inserir a:spAutoFit em bodyPr e deve preservar o XML do template', () => {
    const xml = '<wps:bodyPr rot="0" vert="horz" wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" anchor="t" anchorCtr="0" upright="1"><a:noAutofit/></wps:bodyPr>'

    const resultado = ativarAutoResizeTextboxes(xml)

    expect(resultado).not.toContain('<a:spAutoFit/>')
    expect(resultado).toContain('<wps:bodyPr')
    expect(resultado).not.toContain('<a:noAutofit/>')
  })
})
