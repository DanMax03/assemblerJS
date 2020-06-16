<!doctype html>
<html>
<head>
	<title>Ассемблер</title>
	<link rel="stylesheet" href="index.css"></link>
	<script src="jquery.min.js" type="text/javascript"></script>
</head>
<body>
<?php
define('PAGE', 0x100); // должно совпадать с размером сегмента кода
$n_lines = min(20, PAGE);
echo "<table id='main_table'>\n";
for($i = 0; $i < $n_lines; ++$i)
	echo "\t<tr line='$i'><td class='address'>address<td class='codes' len=''><td class='asm'><input type='text' autocomplete='off'></td><td class='err'></td></tr>\n";
echo "</table>\n";
$exe = array(); for($i = 0; $i < PAGE; ++$i) $exe[] = 0x90; 

// пример
$exe[0] = 0xfe; $exe[1] = 0xc7;	// inc bh
$exe[2] = 0x90;	// nop
$exe[3] = 0x40; // inc eax
$exe[4] = 0xfe; $exe[5] = 0xc8; // dec al
$exe[6] = 0x49; // dec ecx
$exe[7] = 0xfe; $exe[8] = 0x0e; // dec [esi]
$exe[9] = 0xf6; $exe[10] = 0xdf; // neg bh
$exe[9] = 0xf7; $exe[10] = 0xd8; // neg eax
$exe[11] = 0xfe; $exe[12] = 0x48; $exe[13] = 0x34; // dec [eax+34h]


?>
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
	<p>Должны работать кнопки: Down, Up, PageDown, PageUp, Insert, Delete, Enter, Escape</p>
</body>
</html>