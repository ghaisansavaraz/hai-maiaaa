// Simple simply-supported beam: point load F at distance x from support A, span L.
// Ra = F*(L-x)/L, Rb = F - Ra

export function initWorkspaceBeam() {
  const lengthInput = document.getElementById('beamLength');
  const forceInput = document.getElementById('beamForce');
  const posInput = document.getElementById('beamPosition');
  const loadInd = document.getElementById('beamLoadIndicator');

  if (!lengthInput || !forceInput || !posInput || !loadInd) return;

  const lVal = document.getElementById('beamLVal');
  const fVal = document.getElementById('beamFVal');
  const xVal = document.getElementById('beamXVal');
  const raResult = document.getElementById('beamRaResult');
  const rbResult = document.getElementById('beamRbResult');

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

    const percent = L > 0 ? (x / L) * 100 : 0;
    loadInd.style.left = `${percent}%`;
  }

  [lengthInput, forceInput, posInput].forEach((input) => {
    input.addEventListener('input', update);
  });

  update();
}
