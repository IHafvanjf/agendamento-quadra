<?php
require_once 'config.php';
require_once 'db.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$nome     = $input['nome']     ?? '';
$data     = $input['data']     ?? '';
$horario  = $input['horario']  ?? '';
$telefone = $input['telefone'] ?? '';

$valor = 00.01;

if (!$nome || !$data || !$horario) {
    http_response_code(400);
    echo json_encode(['erro' => 'Dados obrigatórios ausentes']);
    exit;
}

$idempotency_key = uniqid('pix_', true);

$payload = [
    "transaction_amount" => $valor,
    "description" => "Agendamento quadra em $data às $horario",
    "payment_method_id" => "pix",
    "payer" => [
        "email" => "teste@teste.com",
        "first_name" => $nome,
        "last_name" => "",
        "identification" => [
            "type" => "CPF",
            "number" => "10412828693"
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/v1/payments');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . MP_ACCESS_TOKEN,
    "X-Idempotency-Key: $idempotency_key"
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$dataMP = json_decode($response, true);

if ($http_code !== 201 || !isset($dataMP['id'])) {
    http_response_code($http_code);
    echo json_encode(['erro' => 'Erro ao gerar pagamento PIX', 'resposta' => $dataMP]);
    exit;
}

$pagamento_id = $dataMP['id'];
$pixCode = $dataMP['point_of_interaction']['transaction_data']['qr_code'] ?? null;
$pixImg  = $dataMP['point_of_interaction']['transaction_data']['qr_code_base64'] ?? null;

if (!$pixCode || !$pixImg) {
    http_response_code(500);
    echo json_encode(['erro' => 'QR Code não retornado']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO agendamentos (nome, data, horario, telefone, status_pagamento, pagamento_id, criado_em, chave_pix, qr_code_base64)
    VALUES (?, ?, ?, ?, 'pendente', ?, NOW(), ?, ?)");
    $stmt->execute([$nome, $data, $horario, $telefone, $pagamento_id, $pixCode, $pixImg]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao salvar no banco', 'mensagem' => $e->getMessage()]);
    exit;
}

echo json_encode([
    'status' => 'sucesso',
    'payment_id' => $pagamento_id,
    'chave_pix' => $pixCode,
    'qr_code_base64' => $pixImg
]);
