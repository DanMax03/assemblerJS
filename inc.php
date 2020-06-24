<?php
include 'conf.php';

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

function hex($n, $len)
{
	$len *= 2;
	$n = dechex($n);
	while(strlen($n) < $len)
		$n = '0' . $n;
	return $n;
}