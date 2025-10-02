<?php
include '../conexao.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    echo "ID inválido";
    exit;
}

$sql = "DELETE FROM agendamentos WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo "Agendamento excluído com sucesso!";
} else {
    echo "Erro ao excluir agendamento.";
}

$conn->close();
?>
