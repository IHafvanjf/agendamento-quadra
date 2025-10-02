const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

let today = new Date();
let todayDate = today.getDate();
let todayMonth = today.getMonth();
let todayYear = today.getFullYear();
let currentMonth = todayMonth;
let currentYear = todayYear;

let dataSelecionada = null;

function updateCalendars() {
  const nav = document.querySelector('.calendar-nav');
  const days = document.querySelector('.days-wrapper');
  nav.innerHTML = `
    <button id="prev-month">&#10094;</button>
    <span class="month-year">${monthNames[currentMonth]} ${currentYear}</span>
    <button id="next-month">&#10095;</button>
  `;
  days.innerHTML = '';

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement('button');
    btn.textContent = d;

    if (d === todayDate && currentMonth === todayMonth && currentYear === todayYear) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      dataSelecionada = `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}`;
      marcarBotaoSelecionado(d);
      carregarDados(dataSelecionada);
    });

    days.appendChild(btn);
  }

  document.getElementById('prev-month').onclick = () => changeMonth(-1);
  document.getElementById('next-month').onclick = () => changeMonth(1);
}

function changeMonth(step) {
  currentMonth += step;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  updateCalendars();
}

function pad(n) {
  return n < 10 ? '0' + n : n;
}

function carregarDados(data = dataSelecionada) {
  let url = 'painel.php';
  if (data) {
    url += `?data=${data}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(dados => {
      const tbody = document.querySelector("#tabelaControle tbody");
      tbody.innerHTML = "";

      if (dados.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>Nenhum agendamento encontrado.</td></tr>";
        return;
      }

      dados.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.nome}</td>
          <td>${item.data}</td>
          <td>${item.horario}</td>
          <td><button onclick="excluirAgendamento(${item.id})">Excluir</button></td>
        `;
        tbody.appendChild(tr);
      });
    });
}

function excluirAgendamento(id) {
  if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;

  fetch(`excluir.php?id=${id}`)
    .then(res => res.text())
    .then(resp => {
      alert(resp);
      carregarDados(); // Atualiza a lista para a data selecionada
    });
}

// Marca o botão do dia selecionado
function marcarBotaoSelecionado(dia) {
  document.querySelectorAll(".days-wrapper button").forEach(btn => {
    btn.classList.remove("active");
    if (parseInt(btn.textContent) === dia) {
      btn.classList.add("active");
    }
  });
}

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  updateCalendars();
  // Não carrega dados até que o usuário selecione um dia
});
