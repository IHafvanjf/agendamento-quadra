<?php
require_once 'config.php';
require_once 'db.php';

header('Content-Type: application/json');

$entrada = file_get_contents("php://input");
$evento = json_decode($entrada, true);
file_put_contents(__DIR__ . '/log_webhook.txt', $entrada . PHP_EOL, FILE_APPEND);

if (!isset($evento['type']) || $evento['type'] !== 'payment') {
    echo json_encode(['status' => 'ignorado']);
    exit;
}

$id_pagamento = $evento['data']['id'] ?? null;
if (!$id_pagamento) {
    http_response_code(400);
    echo json_encode(['erro' => 'ID do pagamento ausente']);
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.mercadopago.com/v1/payments/$id_pagamento");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . MP_ACCESS_TOKEN
]);
$resposta = curl_exec($ch);
curl_close($ch);

$dados_pagamento = json_decode($resposta, true);

if (!isset($dados_pagamento['status']) || $dados_pagamento['status'] !== 'approved') {
    echo json_encode(['status' => 'aguardando']);
    exit;
}

$stmt = $pdo->prepare("UPDATE agendamentos SET status_pagamento = 'aprovado' WHERE pagamento_id = ?");
$stmt->execute([$id_pagamento]);

echo json_encode(['status' => 'ok', 'id' => $id_pagamento]);
?>
