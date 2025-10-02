<?php
require_once 'config.php';
require_once 'db.php';

header('Content-Type: application/json');

$payment_id = $_GET['payment_id'] ?? null;
if (!$payment_id) {
    http_response_code(400);
    echo json_encode(['erro' => 'payment_id ausente']);
    exit;
}

// Consultar status no Mercado Pago
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.mercadopago.com/v1/payments/$payment_id");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . MP_ACCESS_TOKEN
]);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$status_api = $data['status'] ?? null;

if ($status_api) {
    switch (strtolower($status_api)) {
        case 'approved': $status_local = 'aprovado'; break;
        case 'pending': $status_local = 'pendente'; break;
        case 'cancelled':
        case 'rejected': $status_local = 'rejeitado'; break;
        default: $status_local = 'pendente';
    }

    // Verifica status atual no banco
    $stmtCheck = $pdo->prepare("SELECT status_pagamento FROM agendamentos WHERE pagamento_id = ?");
    $stmtCheck->execute([$payment_id]);
    $statusAtual = $stmtCheck->fetchColumn();

    // Atualiza apenas se houver mudança
    if ($statusAtual !== $status_local) {
        $stmt = $pdo->prepare("UPDATE agendamentos SET status_pagamento = ? WHERE pagamento_id = ?");
        $stmt->execute([$status_local, $payment_id]);

        // Enviar mensagem via WhatsApp se for aprovado
        if ($status_local === 'aprovado') {
            $stmtInfo = $pdo->prepare("SELECT telefone, nome FROM agendamentos WHERE pagamento_id = ?");
            $stmtInfo->execute([$payment_id]);
            $agendamento = $stmtInfo->fetch(PDO::FETCH_ASSOC);

            if ($agendamento && !empty($agendamento['telefone'])) {
                $telefone = preg_replace('/\D/', '', $agendamento['telefone']);
                if (strlen($telefone) === 11) {
                    $telefone = '55' . $telefone;
                }

                $nome = $agendamento['nome'];
                $mensagem = "✅ Olá $nome! Seu agendamento foi confirmado com sucesso.\nCaso precise cancelar, acesse nosso site.";

                // Dados Z-API
                $instance_id = '3E2F7E2AE44B50F92A213A8DB35B5585'; // ID da Instância
                $token_zapi = '01F50F5F11C94E0D6FB4D667'; // Token da URL
                $client_token = 'F61888eb7975c4135ab329a9f2942f6a9S'; // Token de segurança (header)

                $payload = [
                    "phone" => $telefone,
                    "message" => $mensagem
                ];

                $curl = curl_init();
                curl_setopt_array($curl, [
                    CURLOPT_URL => "https://api.z-api.io/instances/$instance_id/token/$token_zapi/send-text",
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => json_encode($payload),
                    CURLOPT_HTTPHEADER => [
                        "Content-Type: application/json",
                        "Client-Token: $client_token"
                    ]
                ]);

                $resposta = curl_exec($curl);
                $erro_curl = curl_error($curl);
                curl_close($curl);

                // Log detalhado da tentativa
                file_put_contents('log_zapi.txt', 
                    "=== " . date('Y-m-d H:i:s') . " ===\n" .
                    "Telefone: $telefone\n" .
                    "Mensagem: $mensagem\n" .
                    "Resposta: $resposta\n" .
                    "Erro cURL: $erro_curl\n\n",
                    FILE_APPEND
                );
            }
        }
    }

    echo json_encode([
        'status' => $status_local,
        'status_api' => $status_api,
        'payment_id' => $payment_id
    ]);
} else {
    http_response_code(400);
    echo json_encode(['erro' => 'Status não encontrado', 'resposta' => $data]);
}
?>
