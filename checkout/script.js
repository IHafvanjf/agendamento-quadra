document.addEventListener('DOMContentLoaded', function() {
  // Botão Voltar
  var backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      window.history.back();
    });
  }

  // Botão de copiar
  var copyBtn = document.getElementById('copy-btn');

  // Campo de texto com o código PIX
  var pixInput = document.getElementById('pix-code');

  // Elemento de toast (mensagem de cópia)
  var toast = document.getElementById('toast');

  // Container do QR Code
  var qrPlaceholder = document.querySelector('.qr-placeholder');

  // Container de notificação acima do QR Code
  var notificationDiv = document.getElementById('notification');

  // Recupera dados do sessionStorage
  var qrCodeBase64 = sessionStorage.getItem('qr_code_base64');
  var chavePix = sessionStorage.getItem('chave_pix');
  var paymentId = sessionStorage.getItem('payment_id');

  // Caso os dados não existam, exibe erro
  if (qrCodeBase64 === null || chavePix === null || paymentId === null) {
    qrPlaceholder.innerHTML = '<p style="color:red;">Erro: dados de pagamento não encontrados.</p>';
    return;
  }

  // Cria e insere a imagem do QR Code
  var imgElement = document.createElement('img');
  imgElement.src = 'data:image/png;base64,' + qrCodeBase64;
  imgElement.alt = 'QR Code PIX';
  imgElement.width = 250;
  qrPlaceholder.innerHTML = '';
  qrPlaceholder.appendChild(imgElement);

  // Preenche o campo de texto com a chave PIX
  pixInput.value = chavePix;

  // Adiciona evento de clique para copiar o código PIX
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      pixInput.select();
      document.execCommand('copy');
      showToast();
    });
  }

  // Função para exibir o toast de confirmação
  function showToast() {
    toast.classList.remove('hidden');
    toast.classList.add('visible');
    setTimeout(function() {
      toast.classList.remove('visible');
      toast.classList.add('hidden');
    }, 2000);
  }

  // Função para verificar status do pagamento a cada 5 segundos
  var statusInterval = setInterval(function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'verificar_pagamento.php?payment_id=' + encodeURIComponent(paymentId), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var result = JSON.parse(xhr.responseText);
            if (result.status === 'aprovado') {
              clearInterval(statusInterval);

              // Insere mensagem de sucesso dentro da div de notificação
              notificationDiv.innerHTML = '<p><b style="color:lime;">✅ Pagamento aprovado! Agendamento confirmado.</b></p>';

              // Após 5 minutos, redireciona para a página inicial
              setTimeout(function() {
                window.location.href = '../index.html';
              }, 300000);
            }
          } catch (e) {
            console.error('Não foi possível interpretar a resposta JSON:', e);
          }
        } else {
          console.error('Erro na requisição de verificação:', xhr.statusText);
        }
      }
    };
    xhr.send();
  }, 5000);
});
