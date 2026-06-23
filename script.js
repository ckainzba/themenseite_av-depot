// ============================================================
// ALTERSVORSORGE REFORM – LANDING PAGE SCRIPTS
// ============================================================

/**
 * Toggle between the two option panels (Riester / Kein Riester)
 */
function showOption(key) {
  // Hide all panels
  document.querySelectorAll('.option-panel').forEach(p => p.classList.remove('active'));
  // Deactivate all buttons
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));

  // Show selected panel
  const panel = document.getElementById('panel-' + key);
  if (panel) panel.classList.add('active');

  // Activate selected button
  const btn = document.getElementById('btn-' + key);
  if (btn) btn.classList.add('active');
}

/**
 * Toggle accordion items within option panels
 */
function toggleBereich(id) {
  const item = document.getElementById('bereich-' + id);
  if (!item) return;

  // Find the parent accordion
  const accordion = item.closest('.bereich-accordion');
  if (!accordion) return;

  // Close all siblings
  accordion.querySelectorAll('.bereich-item').forEach(i => {
    if (i !== item) i.classList.remove('active');
  });

  // Toggle current
  item.classList.toggle('active');
}

/**
 * Toggle the reform cards (Why the reform was necessary)
 */
function toggleReformCard(card) {
  const content = card.querySelector('.reform-card-content');
  const icon = card.querySelector('.toggle-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▲';
    card.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)';
  } else {
    content.style.display = 'none';
    icon.textContent = '▼';
    card.style.boxShadow = '';
  }
}

/**
 * Smooth scroll for anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/**
 * Scroll-triggered animation (fade-in on scroll)
 */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(
    '.reform-card, .massnahme-card, .anlageweg-card, .benefit-item, .vergleich-item'
  ).forEach(el => {
    el.classList.add('scroll-fade');
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initFoerderChart();
});

let foerderChartInstance = null;

/**
 * Calculates the datasets based on the number of children
 */
function calculateChartData(kinderCount) {
  const xValues = [];
  const totalZulageValues = [];

  for (let x = 0; x <= 150; x += 10) {
    xValues.push(x);
    let annual_x = x * 12;
    
    // Grundzulage
    let grund = 0;
    if (annual_x <= 360) {
      grund = annual_x * 0.5;
    } else {
      let remaining = Math.min(annual_x - 360, 1800 - 360);
      grund = 180 + remaining * 0.25;
    }
    
    // Kinderzulage: volle Zulage bereits ab 300 € p.a. (25 € mtl.) Eigenbeitrag
    let maxKinder = kinderCount * 300;
    let kinderFraction = Math.min(annual_x / 300, 1.0);
    let kinderzulage = kinderFraction * maxKinder;
    
    totalZulageValues.push(grund + kinderzulage);
  }
  
  return { xValues, totalZulageValues };
}

/**
 * Custom Chart.js Plugin to highlight the 0-30 Euro Area
 */
const highlightStufe1Plugin = {
  id: 'highlightStufe1',
  beforeDraw: (chart) => {
    const { ctx, chartArea, scales } = chart;
    if (!scales.x || !chartArea) return;
    
    // The x-axis is a category scale, so index 0 is 0€, index 3 is 30€
    const xStart = scales.x.getPixelForTick(0);
    const xEnd = scales.x.getPixelForTick(3);
    
    ctx.save();
    // Draw shaded background
    ctx.fillStyle = 'rgba(234, 179, 8, 0.15)'; // gold transparent
    ctx.fillRect(xStart, chartArea.top, xEnd - xStart, chartArea.bottom - chartArea.top);
    
    // Draw vertical border at the end of the highlight
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
    ctx.setLineDash([5, 5]);
    ctx.moveTo(xEnd, chartArea.top);
    ctx.lineTo(xEnd, chartArea.bottom);
    ctx.stroke();
    
    // Draw text label
    ctx.fillStyle = '#b45309'; // amber-700
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Höchste Förderquote', xStart + (xEnd - xStart) / 2, chartArea.top + 20);
    
    ctx.restore();
  }
};

/**
 * Initialize Fördersystematik Chart
 */
function initFoerderChart() {
  const ctx = document.getElementById('foerderChart');
  if (!ctx) return;

  const kinderInput = document.getElementById('kinderInput');
  const initialKinder = kinderInput ? (parseInt(kinderInput.value) || 0) : 0;
  
  const data = calculateChartData(initialKinder);

  foerderChartInstance = new Chart(ctx, {
    type: 'line',
    plugins: [highlightStufe1Plugin],
    data: {
      labels: data.xValues,
      datasets: [
        {
          label: 'Gesamte Förderung (p.a.)',
          data: data.totalZulageValues,
          borderColor: '#ea580c', // var(--orange-600)
          backgroundColor: 'rgba(234, 88, 12, 0.15)',
          borderWidth: 3,
          pointBackgroundColor: '#ea580c',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return 'Eigenbeitrag: ' + context[0].label + ' € mtl.';
            },
            label: function(context) {
              return 'Gesamtförderung: ' + context.raw + ' € p.a.';
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Eigenbeitrag (monatlich in €)',
            color: '#64748b',
            font: { weight: 'bold' }
          },
          grid: { display: false }
        },
        y: {
          title: {
            display: true,
            text: 'Gesamte Förderung (jährlich in €)',
            color: '#64748b',
            font: { weight: 'bold' }
          },
          min: 0,
          suggestedMax: 600,
          ticks: { stepSize: 100 }
        }
      }
    }
  });
}

/**
 * Updates the chart when the input changes
 */
function updateFoerderChart() {
  if (!foerderChartInstance) return;
  
  let kinderInput = document.getElementById('kinderInput');
  let kinderCount = parseInt(kinderInput.value) || 0;
  
  // limit to sensible bounds
  if (kinderCount < 0) { kinderCount = 0; kinderInput.value = 0; }
  if (kinderCount > 10) { kinderCount = 10; kinderInput.value = 10; }
  
  const data = calculateChartData(kinderCount);
  
  foerderChartInstance.data.datasets[0].data = data.totalZulageValues;
  
  foerderChartInstance.update();
}

/**
 * Modals
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}
function closeModalBtn(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}
function closeModal(e, id) {
  if (e.target.id === id) {
    document.getElementById(id).classList.remove('active');
  }
}
