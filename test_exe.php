<?php
	include 'inc.php';
	
	if(!isset($_POST['cs'])) exit('Программа отсутствует.');
	if(!is_array($_POST['cs'])) exit('Программа в неверном формате');
	$codes = $_POST['cs'];
	if(count($codes) != PAGE) exit('Программа задана не верно.');
	
	if(!isset($_POST['ds'])) exit('Сегмент данных отсутствует.');
	if(!is_array($_POST['ds'])) exit('Сегмент данных в неверном формате');
	$data = $_POST['ds'];
	if(count($data) != PAGE) exit('Сегмент данных задан не верно.');
	
	if(!isset($_POST['task_id']) || !trim($_POST['task_id'])) exit('Не указан номер задачи.');
	$task_id = trim($_POST['task_id']);
	if(!preg_match('/^[0-9]+$/', $task_id)) exit('Неверно задан номер задачи.');

	$exe = file_get_contents(TASK_EXE_FULL_PATH);
	for($i = 0; $i < PAGE; ++$i)
		$exe[$i + EXE_CS_OFFSET] = chr($codes[$i]);
	for($i = 0; $i < PAGE; ++$i)
		$exe[$i + EXE_DS_OFFSET] = chr($data[$i]);


	$params = array(
		'task_id' => $task_id,
		'exe' => $exe,
	);
	$result = file_get_contents(JOBE_EXE_URL, false, stream_context_create(array(
		'http' => array(
			'method'  => 'POST',
			'header'  => 'Content-type: application/x-www-form-urlencoded',
			'content' => http_build_query($params)
		)
	)));

	if($result === false) exit('Файл протестировать не удалось.');
	
	echo $result;
