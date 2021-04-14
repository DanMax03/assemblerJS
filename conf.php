<?php
	// Не должен быть слишком маленьким, чтобы было чем заполнить 20 строк
	define('CODE_PAGE', 0x200); // размер сегмента кода и он же размер сегмента данных
	define('DATA_PAGE', 0x100); // размер сегмента кода и он же размер сегмента данных
	define('EXE_CS_OFFSET', 0x400); // начало сегмента кода в файле
	define('EXE_DS_OFFSET', 0x600); // начало сегмента данных в файле
	define('EXE_CS_ADDRESS', 0x401000); // начало сегмента кода в файле
	define('EXE_DS_ADDRESS', 0x402000); // начало сегмента данных в файле
	define('TASK_EXE_FULL_PATH', './task.exe');
	//define('JOBE_EXE_URL', 'http://jobe_exe/');
	//define('JOBE_EXE_URL', 'http://130.193.36.223/'); // yandex.ru
	//define('JOBE_EXE_URL', 'http://81.91.179.181:443/');	// сервер Димы Карелина
	//define('JOBE_EXE_URL', 'http://localhost:3000/');
	if(1){
		// тестируем с помощью Python
		define('JOBE_EXE_URL', 'http://193.124.115.156:443/file');
		define('TEST_EXE', 'test_exe_python.php');
	}else{
		// тестируем с помощью Apache & php
		define('JOBE_EXE_URL', 'http://81.91.179.181/');
		define('TEST_EXE', 'test_exe_apache.php');
	}