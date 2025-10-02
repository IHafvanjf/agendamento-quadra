<?php
header("Content-Type: application/json");
include 'conexao.php';

$data = $_GET['data'] ?? null;

if (!$data) {
    echo json_encode(["success" => false, "message" => "Data não informada."]);
    exit;
}

$stmt = $conn->prepare("SELECT horario FROM agendamentos WHERE data = ? AND status_pagamento = 'aprovado'");
$stmt->bind_param("s", $data);
$stmt->execute();
$result = $stmt->get_result();

$horarios = [];
while ($row = $result->fetch_assoc()) {
    $horarios[] = $row['horario'];
}

echo json_encode(["success" => true, "horarios" => $horarios]);

$stmt->close();
$conn->close();
