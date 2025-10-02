<?php
require_once 'config.php';
require_once 'db.php';
header('Content-Type: application/json');

$payment_id = $_GET['payment_id'] ?? null;
if (!$payment_id) {
  echo json_encode(['erro' => 'payment_id ausente']);
  exit;
}

$stmt = $pdo->prepare("SELECT chave_pix, qr_code_base64 FROM agendamentos WHERE pagamento_id = ?");
$stmt->execute([$payment_id]);
$dados = $stmt->fetch(PDO::FETCH_ASSOC);

if ($dados) {
  echo json_encode($dados);
} else {
  echo json_encode(['erro' => 'Pagamento n\u00e3o encontrado']);
}
