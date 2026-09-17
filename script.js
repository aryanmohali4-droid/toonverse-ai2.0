// Shared saveToHistory function used across pages
function saveToHistory(prompt, imageUrl, category) {
  const history = JSON.parse(localStorage.getItem('toonverse_history') || '[]');
  const record = {
    generationId: 'gen_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    prompt: prompt,
    imageUrl: imageUrl,
    createdAt: new Date().toISOString(),
    category: category,
    status: 'completed'
  };
  history.push(record);
  const trimmed = history.slice(-50);
  localStorage.setItem('toonverse_history', JSON.stringify(trimmed));
  return record;
}

// Home page specific interactions
document.addEventListener('DOMContentLoaded', () => {
  const chips = document.querySelectorAll('#chips .quick-chip');
  const promptInput = document.getElementById('promptInput');
  const goCreateBtn = document.getElementById('goCreateBtn');

  let selectedStyle = chips.length ? chips[0].dataset.style : 'anime style, highly detailed';

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedStyle = chip.dataset.style;
    });
  });

  if (goCreateBtn) {
    goCreateBtn.addEventListener('click', () => {
      const text = promptInput ? promptInput.value.trim() : '';
      const url = 'create.html?style=' + encodeURIComponent(selectedStyle) + (text ? '&prompt=' + encodeURIComponent(text) : '');
      window.location.href = url;
    });
  }
});
