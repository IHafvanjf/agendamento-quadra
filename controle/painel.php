<?php
header("Content-Type: application/json");
include '../conexao.php';

$data = $_GET['data'] ?? null;

$sql = "SELECT id, nome, data, horario FROM agendamentos";
if ($data) {
    $sql .= " WHERE data = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $data);
} else {
    $sql .= " ORDER BY data DESC, horario ASC";
    $stmt = $conn->prepare($sql);
}

$stmt->execute();
$result = $stmt->get_result();
$dados = [];

while ($row = $result->fetch_assoc()) {
    $dados[] = [
        "id" => $row['id'],
        "nome" => $row['nome'],
        "data" => $row['data'],
        "horario" => substr($row['horario'], 0, 5)
    ];
}

echo json_encode($dados);
$conn->close();
?>
