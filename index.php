<!doctype html>
<html>
<head>
	<title>Ассемблер</title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<link rel="stylesheet" href="index.css"></link>
	<script src="jquery.min.js" type="text/javascript"></script>
</head>
<body>
<?php
include 'inc.php';
$n_lines = min(20, PAGE);
echo "<table id='main_table'>\n";
for($i = 0; $i < $n_lines; ++$i)
	echo "\t<tr line='$i'><td class='address'>address<td class='codes' len=''><td class='asm'><input type='text' autocomplete='off'></td><td class='err'></td></tr>\n";
echo "</table>\n";

/*
$exe_str = substr(file_get_contents(TASK_EXE_FULL_PATH), EXE_CS_OFFSET, PAGE);
$exe = array();
for($i = 0; $i < strlen($exe_str); ++$i)
	$exe[] = ord($exe_str[$i]);
*/
// пример
$exe = array(); for($i = 0; $i < PAGE; ++$i) $exe[] = 0x90; 
/*
$exe[0] = 0xfe; $exe[1] = 0xc7;	// inc bh
$exe[2] = 0x90;	// nop
$exe[3] = 0x40; // inc eax
$exe[4] = 0xfe; $exe[5] = 0xc8; // dec al
$exe[6] = 0x49; // dec ecx
$exe[7] = 0xfe; $exe[8] = 0x0e; // dec [esi]
$exe[9] = 0xf6; $exe[10] = 0xdf; // neg bh
$exe[11] = 0xf7; $exe[12] = 0xd8; // neg eax
//$exe[13] = 0xfe; $exe[14] = 0x48; $exe[15] = 0x34; // dec [eax+34h]
*/

?>
	<textarea id='asm_text'></textarea>
	<a href='#' id='copy_asm2textarea' title='Скопировать программу в поле memo'>&#8595;</a>
	<a href='#' id='copy_textarea2asm' title='Скопировать программу из поля memo'>&#8593;</a>
	
	<p><a href='help_editor.html' target='_blank'>Справка по кнопочкам</a></p>
	
	<form method='post' action='get_exe.php' target='_blank' class='get_exe'>
		<input type='text' name='codes_str' id='codes_str' value=''>
		<input type='submit' value='Получить *.exe файл'>
	</form>
	
	<script>
		'use strict';
		var n_lines = <?=$n_lines?>;
		var scroll_page = 5;
		var address0 = 0x40100;
		var PAGE = <?=PAGE?>;
		var exe = [<?=implode($exe, ', ')?>];
	</script>
	<script src="asm.js" type="text/javascript"></script>
	<script src="index.js" type="text/javascript"></script>
</body>
</html>