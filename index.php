<?php
	include 'inc.php';
	$n_lines = min(20, PAGE);

	$cs_str = substr(file_get_contents(TASK_EXE_FULL_PATH), EXE_CS_OFFSET, PAGE);
	$code_seg = array();
	for($i = 0; $i < strlen($cs_str); ++$i)
		$code_seg[] = ord($cs_str[$i]);

	// пример
	//$code_seg = array(); for($i = 0; $i < PAGE; ++$i) $code_seg[] = 0x90; 
	/*
	$code_seg[0] = 0xfe; $code_seg[1] = 0xc7;	// inc bh
	$code_seg[2] = 0x90;	// nop
	$code_seg[3] = 0x40; // inc eax
	$code_seg[4] = 0xfe; $code_seg[5] = 0xc8; // dec al
	$code_seg[6] = 0x49; // dec ecx
	$code_seg[7] = 0xfe; $code_seg[8] = 0x0e; // dec [esi]
	$code_seg[9] = 0xf6; $code_seg[10] = 0xdf; // neg bh
	$code_seg[11] = 0xf7; $code_seg[12] = 0xd8; // neg eax
	//$code_seg[13] = 0xfe; $code_seg[14] = 0x48; $code_seg[15] = 0x34; // dec [eax+34h]
	*/
	
	$date_seg_str = substr(file_get_contents(TASK_EXE_FULL_PATH), EXE_DS_OFFSET, PAGE);
	$date_seg = array();
	for($i = 0; $i < strlen($date_seg_str); ++$i)
		$date_seg[] = ord($date_seg_str[$i]);

	$maxlen_datatext = PAGE + intdiv(PAGE - 1, 16);
	$maxlen_datacode = PAGE * 3 - 1;
	$ds_str = array();
	$ds_bytes = '';
	$ds_addresses = array();
	for($i = 0; $i < intdiv(PAGE - 1 + 16, 16); ++$i){
		$q = substr($date_seg_str, $i * 16, 16);
		$s = '';
		for($j = 0; $j < strlen($q); ++$j){
			$ds_bytes .= hex(ord($q[$j]), 1) . ($j == 7 ? '  ' : ' ');
			$q[$j] = $q[$j] >= ' ' && $q[$j] <= '~' ? $q[$j] : '.';
		}
		$ds_str[] = $q;
		$ds_bytes[strlen($ds_bytes) - 1] = "\n";
		$ds_addresses[] = hex(EXE_DS_ADDRESS + $i * 16, 4);
	}
	$ds_str = implode("\n", $ds_str);
	$ds_addresses = implode("\n", $ds_addresses);
	$ds_bytes = mb_substr($ds_bytes, 0, -1);
	$ds_lines = intdiv(PAGE + 15, 16);
?>
<!doctype html>
<html>
<head>
	<title>Ассемблер</title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<link rel="stylesheet" href="index.css"></link>
	<script src="jquery.min.js" type="text/javascript"></script>
</head>
<body>
	<div class='segment'><fieldset>
		<legend>Сегмент кода</legend>
<?php
echo "\t\t<table id='main_table'>\n";
for($i = 0; $i < $n_lines; ++$i)
	echo "\t\t\t<tr line='$i'><td class='address'>address<td class='codes' len=''><td class='asm'><input type='text' autocomplete='off'></td><td class='err'></td></tr>\n";
echo "\t\t</table>\n";
?>
		<p><a href='help_editor.html' target='_blank'>Справка по кнопочкам</a></p>
		<textarea id='asm_text'></textarea>
		<a href='#' id='copy_asm2textarea' title='Скопировать программу в поле memo'>&#8595;</a>
		<a href='#' id='copy_textarea2asm' title='Скопировать программу из поля memo'>&#8593;</a>
	</fieldset></div>

	<div class='data segment'><fieldset>
		<legend>Сегмент данных</legend>
		<textarea cols=7 rows=1 readonly class='noframe'></textarea>
		<textarea cols=47 rows=1 readonly class='noframe'>00 01 02 03 04 05 06 07  08 09 0a 0b 0c 0d 0e 0f</textarea>
		<textarea cols=15 rows=1 readonly class='noframe'>0123456789abcdef</textarea>
		<br>
		<textarea cols=7 rows=<?=$ds_lines?> readonly class='noframe'><?=$ds_addresses?></textarea>
		<textarea cols=47 rows=<?=$ds_lines?> maxlength=<?=$maxlen_datacode?>><?=$ds_bytes?></textarea>
		<textarea cols=15 rows=<?=$ds_lines?> maxlength=<?=$maxlen_datatext?>><?=$ds_str?></textarea>
		<div contenteditable>Для переключением между режимами вставки и замены поставьте курсор сюда<br>и нажмине на клавиатуре клавишу Insert</div>
	</fieldset></div>
	
	<div class='segment'>
		
		<form method='post' action='get_exe.php' target='_blank' class='get_exe'>
			<input type='text' name='codes_str' id='codes_str' value=''>
			<input type='submit' value='Получить *.exe файл'>
		</form>
		
		<fieldset method='post' action='test_exe.php' class='test_exe'>
			<legend>Тестирование</legend>
			Номер задачи
			<input type='text' id='task_id' value=''>
			<input type='submit' value='Протестировать'>
			<p>Результат:</p>
			<textarea id='test_result'></textarea>
		</fieldset>
		
	</div>
	
	<script>
		'use strict';
		var n_lines = <?=$n_lines?>;
		var scroll_page = 5;
		var address0 = <?=EXE_CS_ADDRESS?>;
		var PAGE = <?=PAGE?>;
		var exe = [<?=implode($code_seg, ', ')?>];
	</script>
	<script src="asm_table.js" type="text/javascript"></script>
	<script src="asm.js" type="text/javascript"></script>
	<script src="index.js" type="text/javascript"></script>
</body>
</html>