// Simple simply-supported beam: point load F at distance x from support A, span L.
// Ra = F*(L-x)/L, Rb = F - Ra

export function initWorkspaceBeam() {
  const lengthInput = document.getElementById('beamLength');
  const forceInput = document.getElementById('beamForce');
  const posInput = document.getElementById('beamPosition');
  const loadGroup = document.getElementById('loadGroup');

  if (!lengthInput || !forceInput || !posInput || !loadGroup) return;

  const lVal = document.getElementById('beamLVal');
  const fVal = document.getElementById('beamFVal');
  const xVal = document.getElementById('beamXVal');
  const raResult = document.getElementById('beamRaResult');
  const rbResult = document.getElementById('beamRbResult');
  const totalLoad = document.getElementById('beamTotalLoad');
  const loadLabel = document.getElementById('loadLabel');
  const dimAText = document.getElementById('dimAText');
  const dimLText = document.getElementById('dimLText');
  const raArrowLabel = document.getElementById('raArrowLabel');
  const rbArrowLabel = document.getElementById('rbArrowLabel');
  const dimA = document.getElementById('dimA');
  const dimL = document.getElementById('dimL');

  function update() {
    const L = parseFloat(lengthInput.value);
    const F = parseFloat(forceInput.value);
    let x = parseFloat(posInput.value);

    if (x > L) {
      x = L;
      posInput.value = String(L);
    }
    posInput.max = String(L);

    if (lVal) lVal.textContent = String(L);
    if (fVal) fVal.textContent = String(F);
    if (xVal) xVal.textContent = x.toFixed(1);

    const Ra = (F * (L - x)) / L;
    const Rb = F - Ra;

    if (raResult) raResult.textContent = `${Ra.toFixed(2)} kN`;
    if (rbResult) rbResult.textContent = `${Rb.toFixed(2)} kN`;
    if (totalLoad) totalLoad.textContent = `${F.toFixed(2)} kN`;
    if (loadLabel) loadLabel.textContent = `${F}kN`;
    if (raArrowLabel) raArrowLabel.textContent = `RA: ${Ra.toFixed(1)}kN`;
    if (rbArrowLabel) rbArrowLabel.textContent = `RB: ${Rb.toFixed(1)}kN`;
    if (dimAText) dimAText.textContent = `a: ${x.toFixed(1)}m`;
    if (dimLText) dimLText.textContent = `${L}m`;

    // Move load group horizontally: 120px (left edge) + (x/L) * 560px (beam width)
    const loadX = 120 + (x / L) * 560;
    if (loadGroup) loadGroup.setAttribute('transform', `translate(${loadX}, 0)`);

    // Update dimension line 'a' (from support A to load)
    // The line goes from x=120 to x=loadX at y=255
    if (dimA) {
      const dimALine = dimA.querySelector('line:nth-of-type(1)');
      const dimALeft = dimA.querySelector('line:nth-of-type(2)');
      const dimARight = dimA.querySelector('line:nth-of-type(3)');
      const dimATextEl = dimA.querySelector('text');
      
      if (dimALine) {
        dimALine.setAttribute('x2', String(loadX));
      }
      if (dimARight) {
        dimARight.setAttribute('x1', String(loadX));
        dimARight.setAttribute('x2', String(loadX));
      }
      if (dimATextEl) {
        const midX = (120 + loadX) / 2;
        dimATextEl.setAttribute('x', String(midX));
      }
    }

    // Update dimension line 'L' (full beam length)
    // The line goes from x=120 to x=680 at y=275 (below the 'a' line)
    if (dimL) {
      const dimLTextEl = dimL.querySelector('text');
      if (dimLTextEl) {
        const midX = (120 + 680) / 2;
        dimLTextEl.setAttribute('x', String(midX));
      }
    }
  }

  [lengthInput, forceInput, posInput].forEach((input) => {
    input.addEventListener('input', update);
  });

  update();
}
