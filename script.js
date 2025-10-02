
// — preço por hora e refs do resumo (escopo global)
const PRICE_PER_HOUR = 100;
const summaryBar = document.getElementById('booking-summary');
const summaryTextEl = document.getElementById('summary-text');

document.addEventListener('DOMContentLoaded', function() {
  // scroll suave
  function smoothScrollTo(endY, duration = 800) {
    const startY = window.pageYOffset;
    const distance = endY - startY;
    let startTime = null;
    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    function step(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutQuad(progress));
      if (elapsed < duration) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // nav links
  const navbar = document.querySelector('.navbar');
  const navbarHeight = navbar ? navbar.offsetHeight : 0;
  document
    .querySelectorAll('.nav-menu a[href^="#"]')
    .forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        smoothScrollTo(top, 800);
        const navToggle = document.getElementById('nav-toggle');
        if (navToggle && navToggle.checked) navToggle.checked = false;
      });
    });

  // loader
  setTimeout(() => {
    const loader = document.getElementById('loader');
    document.body.classList.add('loaded');
    loader.classList.add('fade-out');
    loader.addEventListener('transitionend', () => loader.style.display = 'none');
  }, 2000);

  // slider principal
  (function() {
    const track = document.querySelector('.slider__track');
    const slides = track ? Array.from(track.children) : [];
    const btnPrev = document.querySelector('.slider__arrow--prev');
    const btnNext = document.querySelector('.slider__arrow--next');
    let idx = 0;
    if (!track || !slides.length) return;
    function update() {
      track.style.transform = `translateX(-${100 * idx / slides.length}%)`;
    }
    btnPrev?.addEventListener('click', () => {
      idx = (idx - 1 + slides.length) % slides.length;
      update();
    });
    btnNext?.addEventListener('click', () => {
      idx = (idx + 1) % slides.length;
      update();
    });
  })();

  document.querySelector('.slider__btn')?.addEventListener('click', e => {
    e.preventDefault();
    alert('Redirecionando para a página de marcação...');
  });

  // slider de profissionais com dots
  (function() {
    const wrapper = document.querySelector('.profissionais-wrapper');
    const slider = document.querySelector('.profissionais-slider');
    if (!wrapper || !slider) return;
    const slides = Array.from(slider.children);
    if (!slides.length) return;
    const dots = document.createElement('div');
    dots.className = 'prof-dots';
    wrapper.appendChild(dots);
    let current = 0;
    const gap = parseInt(getComputedStyle(slider).gap) || 16;

    slides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'prof-dot';
      if (i === 0) dot.classList.add('prof-dot--active');
      dot.addEventListener('click', () => {
        current = i;
        scrollToCurrent();
        resetAutoplay();
      });
      dots.appendChild(dot);
    });

    function scrollToCurrent() {
      const sliderPad = parseInt(getComputedStyle(slider).paddingLeft) || 0;
      const targetLeft = slides[current].offsetLeft - sliderPad;
      const maxLeft = slider.scrollWidth - slider.clientWidth;
      slider.scrollTo({ left: Math.min(targetLeft, maxLeft), behavior: 'smooth' });

      dots.querySelectorAll('.prof-dot').forEach((d, i) => {
        d.classList.toggle('prof-dot--active', i === current);
      });
    }

    let auto = setInterval(() => {
      current = (current + 1) % slides.length;
      scrollToCurrent();
    }, 2500);

    function resetAutoplay() {
      clearInterval(auto);
      auto = setInterval(() => {
        current = (current + 1) % slides.length;
        scrollToCurrent();
      }, 2000);
    }
  })();

  // animação título matrícula
  (function() {
    const sec = document.querySelector('.matricula-section');
    if (!sec) return;
    new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            sec.classList.add('visible');
            obs.unobserve(sec);
          }
        });
      },
      { threshold: 0.3 }
    ).observe(sec);
  })();

  // quando input foca, rola modal
  const inputs = document.querySelectorAll('.step-nome input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      document.querySelector('.modal-window').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  });
});

// referências do modal
const modal = document.getElementById('booking-modal');
const backdrop = modal.querySelector('.modal-backdrop');
const closeBtn = modal.querySelector('.modal-close');
const modalWindow = modal.querySelector('.modal-window'); // <––
const btnOpen = document.querySelector('.quadra-cta-btn');
const stepNome = modal.querySelector('.step-nome');
const stepCal = modal.querySelector('.step-calendar');
const stepTimes = modal.querySelector('.step-times');
const btnNome = document.getElementById('btn-nome');
const inputNome = document.getElementById('input-nome');
const inputTelefone = document.getElementById('input-telefone');
const inputEmail = document.getElementById('input-email');
const monthYearEl = modal.querySelector('.month-year');
const prevMon = modal.querySelector('.prev-month');
const nextMon = modal.querySelector('.next-month');
const calBody = modal.querySelector('.calendar tbody');
const selDateEl = document.getElementById('selected-date');
const timesList = document.querySelector('.times-list');
const confirmBtn = document.querySelector('.confirm-times');

let today = new Date();
let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
let chosenDate = null;
const chosenSlots = new Set();
let nomeCliente = '', telefoneCliente = '', emailCliente = '';

// abrir modal
btnOpen.addEventListener('click', e => {
  e.preventDefault();
  modal.classList.remove('hidden');
  stepNome.classList.remove('hidden');
  stepCal.classList.add('hidden');
  stepTimes.classList.add('hidden');
  hideSummary();
});

// prevenir clique interno fechar
modalWindow.addEventListener('click', e => {
  e.stopPropagation();
});

// avançar do nome
btnNome.addEventListener('click', () => {
  nomeCliente     = inputNome.value.trim();
  telefoneCliente = inputTelefone.value.trim();
  emailCliente    = inputEmail.value.trim();

  if (!nomeCliente) {
    alert('Por favor, insira seu nome.');
    return;
  }

  stepNome.classList.add('hidden');
  stepCal.classList.remove('hidden');
  stepTimes.classList.add('hidden');
  renderCalendar();
});

// render calendário
function renderCalendar() {
  monthYearEl.textContent = viewDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
  calBody.innerHTML = '';
  let row = document.createElement('tr');
  const firstDay = viewDate.getDay();
  for (let i = 0; i < firstDay; i++) {
    row.appendChild(document.createElement('td'));
  }
  const days = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    if (row.children.length === 7) {
      calBody.appendChild(row);
      row = document.createElement('tr');
    }
    const cell = document.createElement('td');
    cell.textContent = d;
    const dt = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    if (dt.toDateString() === today.toDateString()) {
      cell.classList.add('today');
    }
    cell.addEventListener('click', () => {
      chosenDate = dt;
      stepCal.classList.add('hidden');
      stepTimes.classList.remove('hidden');
      selDateEl.textContent = chosenDate.toLocaleDateString('pt-BR', {
        day:   '2-digit',
        month: '2-digit',
        year:  'numeric'
      });

      // buscar horários ocupados
      const dataStr = chosenDate.toISOString().split('T')[0];
      fetch(`horarios_ocupados.php?data=${dataStr}`)
        .then(res => res.json())
        .then(json => {
          const ocupados = json.success ? json.horarios : [];
          generateTimeSlots(ocupados);
        })
        .catch(() => {
          alert('Erro ao buscar horários ocupados.');
          generateTimeSlots([]);
        });
    });
    row.appendChild(cell);
  }
  while (row.children.length < 7) {
    row.appendChild(document.createElement('td'));
  }
  calBody.appendChild(row);
}

// navegação meses
prevMon.addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  renderCalendar();
});
nextMon.addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  renderCalendar();
});

// gerar slots de horário
function generateTimeSlots(ocupados = []) {
  timesList.innerHTML = '';
  chosenSlots.clear();
  hideSummary();

  const ocupadosFormatados = ocupados.map(h => h.slice(0, 5)); // "09:00"

  for (let h = 9; h <= 19; h++) {
    const horaFormatada = `${h.toString().padStart(2, '0')}:00`;
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.textContent = horaFormatada;

    if (ocupadosFormatados.includes(horaFormatada)) {
      slot.classList.add('disabled');
      slot.textContent += ' (ocupado)';
    } else {
      slot.addEventListener('click', () => {
        if (chosenSlots.has(h)) {
          chosenSlots.delete(h);
          slot.classList.remove('selected');
        } else {
          chosenSlots.add(h);
          slot.classList.add('selected');
        }
        updateSummary();
      });
    }
    timesList.appendChild(slot);
  }
}

// script.js (atualizado - trecho do confirmBtn)

confirmBtn.addEventListener('click', () => {
  if (!chosenSlots.size) {
    alert('Selecione pelo menos um horário.');
    return;
  }

  const horariosSelecionados = Array.from(chosenSlots).map(h =>
    `${h.toString().padStart(2, '0')}:00`
  );
  const dataSelecionada = chosenDate.toISOString().split('T')[0];

const payload = {
  nome:     nomeCliente,
  telefone: telefoneCliente || '',
  data:     dataSelecionada,
  horario:  horariosSelecionados[0] // 1 horário por vez
};

fetch('checkout/gerar_pix.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
    .then(res => res.json())
    .then(data => {
      if (!data.qr_code_base64) {
        alert('Erro ao gerar pagamento PIX.');
        return;
      }

      // Salva dados da sessão para usar no checkout
      sessionStorage.setItem('qr_code_base64', data.qr_code_base64);
      sessionStorage.setItem('chave_pix', data.chave_pix);
      sessionStorage.setItem('payment_id', data.payment_id);

      // Redireciona para página de checkout
      window.location.href = 'checkout/index.html';
    })
    .catch(() => {
      alert('Erro ao conectar com servidor.');
    });
});



// fechar modal clicando fora ou no “x”
backdrop.addEventListener('click', () => modal.classList.add('hidden'));
closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

// resumo de valores
function updateSummary() {
  const count = chosenSlots.size;
  if (count === 0) {
    hideSummary();
  } else {
    summaryTextEl.textContent = `${count} Hora${count > 1 ? 's' : ''} = R$ ${count * PRICE_PER_HOUR}`;
    summaryBar.classList.remove('hidden');
  }
}
function hideSummary() {
  summaryBar.classList.add('hidden');
}
