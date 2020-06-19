<?php
define('PAGE', 0x100); // должно совпадать с размером сегмента кода
define('EXE_CS_OFFSET', 0x400); // должно совпадать с размером сегмента кода

function string_force_download($s, $file_name) {
	// заставляем браузер показать окно сохранения файла
	header('Content-Description: File Transfer');
	header('Content-Type: application/octet-stream');
	header('Content-Disposition: attachment; filename=' . $file_name);
	header('Content-Transfer-Encoding: binary');
	header('Expires: 0');
	header('Cache-Control: must-revalidate');
	header('Pragma: public');
	header('Content-Length: ' . strlen($s));
	// отправляем файл пользователю
	echo $s;
	exit;
}