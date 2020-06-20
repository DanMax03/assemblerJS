<?php
define('PAGE', 0x100); // размер сегмента кода и он же размер сегмента данных
define('EXE_CS_OFFSET', 0x400); // начало сегмента кода в файле
define('EXE_DS_OFFSET', 0x600); // начало сегмента данных в файле
define('TASK_EXE_FULL_PATH', './task.exe');
define('JOBE_EXE_URL', 'http://192.168.112.129/');

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