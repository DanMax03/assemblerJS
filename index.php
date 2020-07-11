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

	$ds_lines = intdiv(PAGE + 15, 16);
	$maxlen_datatext = PAGE + $ds_lines;
	$maxlen_datacode = PAGE * 3 + $ds_lines;
	$ds_addresses = array();
	for($i = 0; $i < intdiv(PAGE - 1 + 16, 16); ++$i)
		$ds_addresses[] = hex(EXE_DS_ADDRESS + $i * 16, 4);
	$ds_addresses = implode("\n", $ds_addresses);
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
	<form method='post' action='get_exe.php' target='_blank' class='get_exe' id="exe-button">
			<input type='text' name='cs_str' id='cs_str' value=''>
			<input type='text' name='ds_str' id='ds_str' value=''>
			<input type='submit' value='.exe' id="inside-exe-button">
	</form>
	<!---<button onclick="show_window_exemples_2()" id="exe-button">
	<div id="inside-exe-button"> <h2>.exe</h2> 
	</div></button>-->
	<div class="overlay" id="commands-window">
	<div class="flex-window" >
		<div class="window">
		<div class="close_window"><p id="close_symbol" >&#215;</p></div>
		<p stile="width: 100%; font-size: 1.1rem;">Справка по работе с редактором (относится только к сегменту кода)</p>
		<table id="table_for_commands">
			<tr>
				<td id="tsp1"><p id="hq">Клавиша</p></td>
				<td id="tsp1"><p>Действие</p></td>
			</tr>
			<tr>
				<td id="tsp1"><p id="hq">Enter</p></td>
				<td id="tsp1"><p>Трансляция команды в машинный код</p></td>
			</tr>
			<tr>
				<td id="tsp1"><p id="hq">Down</p></td>
				<td id="tsp1"><p>Переход на строку вниз без трансляции команды</p></td>
			</tr>
			<tr>
				<td id="tsp1"><p id="hq">Up</p></td>
				<td id="tsp1"><p>Переход на строку вверх без трансляции команды</p></td>
			</tr>
			<tr>
				<td id="tsp1"><p id="hq">PageDown</p></td>
				<td id="tsp1"><p>Прокрутка страницы на несколько строк вниз</p></td>
			</tr>
			<tr>
				<td id="tsp1"><p id="hq">PageUp</p></td>
				<td id="tsp1"><p>Прокрутка страницы на несколько строк вверх</p></td>
			</tr>
			<tr>
				<td id="tsp1"><p id="hq">Escape</p></td>
				<td id="tsp1"><p>Повторное дизассемблирование команды текущей строки (отмена изменений)</p></td>
			</tr>
			<tr>
				<td id="tsp1"><p id="hq">Insert</p></td>
				<td id="tsp1"><p>Добавление команды nop перед текущей строкой</p></td>
			</tr>
			<tr>
				<td id="tsp1"><p id="hq">Delete</p></td>
				<td id="tsp1"><p>Удаление команды текущей строки</p></td>
			</tr>
		</table> 
		</div>
	</div>
	</div>

	
	<img src="logo.svg" alt="" id="logo"> 

	<button onclick="show_window_exemples()"id="exemples-button">Примеры работы с редактором</button>

	<div id="main_background">
	<div class='segment'><fieldset>
			<legend>Сегмент кода</legend>
			<div id="menu-segment-1">
				<div id="flex-box">
					<button onclick="show_window()" id="commands-buttom" class="commands-buttom"><div id="inside-border"><p>Справка по кнопочкам</p></div></button>
					<a href='#' id='copy_asm2textarea' class="commands-buttom" title='Скопировать программу в поле memo'><div id="inside-border"> <p>Скопировать программу в поле</p></div></a>
					<a href='#' id='copy_textarea2asm' class="commands-buttom" title='Скопировать программу из поля memo'><div id="inside-border"> <p>Скопировать программу из поля</p></div></a>
				</div>
			</div>
			<div id="editor-segment-1">
				<?php
				echo "\t\t<table id='main_table'>\n";
				for($i = 0; $i < $n_lines; ++$i)
					echo "\t\t\t<tr line='$i'><td class='address'>address<td class='codes' len=''><td class='asm'><input type='text' autocomplete='off'></td></tr>\n";
				echo "\t\t</table>\n";
				?>
				<div id="for-error-table">
				<div id="if">
					<textarea id='asm_text'>Поле</textarea>
					<textarea id='asm_text2' readonly> Achtung! Error: 00040100: Неизвестная команда</textarea>
					</div>
				</div>
			</div>
		</fieldset></div>

		<div class='err segment'><fieldset>
			<legend>Ошибки ассемблирования</legend>
			<table>
				<thead>
					<tr><th>Адрес</th><th>Команда</th><th>Ошибка</th></tr>
				</thead>
				<tbody>
				</tbody>
			</table>
		</fieldset></div>
		
		<div class='data segment'><fieldset>
			<legend>Сегмент данных</legend>
			<textarea cols=7 rows=1 readonly class='noframe'></textarea>
			<textarea cols=47 rows=1 readonly class='noframe'>00 01 02 03 04 05 06 07  08 09 0a 0b 0c 0d 0e 0f</textarea>
			<textarea cols=15 rows=1 readonly class='noframe'>0123456789abcdef</textarea>
			<br>
			<textarea cols=7 rows=<?=$ds_lines + 1?> readonly class='noframe'><?=$ds_addresses?></textarea>
			<textarea cols=47 rows=<?=$ds_lines + 1?> id='ds_bytes' maxlength=<?=$maxlen_datacode?>></textarea>
			<textarea cols=15 rows=<?=$ds_lines + 1?> id='ds_text' maxlength=<?=$maxlen_datatext?>></textarea>
			<div contenteditable>Для переключением между режимами вставки и замены поставьте курсор сюда<br>и нажмине на клавиатуре клавишу Insert</div>
		</fieldset></div>
		
	<div class='segment'>
		<form method='post' action='get_exe.php' target='_blank' class='get_exe'>
			<input type='text' name='cs_str' id='cs_str' value=''>
			<input type='text' name='ds_str' id='ds_str' value=''>
			<input type='submit' value='Получить *.exe файл'>
		</form>
	</div>
		
		<div class='segment'><fieldset method='post' action='test_exe.php' class='test_exe'>
			<legend>Тестирование</legend>
<?php include 'select.inc.html'; ?>
			<input type='submit' value='Протестировать'>
			<p>Результат:</p>
			<textarea id='test_result' cols=80 rows=20></textarea>
		</fieldset></div>
	</div>
	<script>
		'use strict';
		var n_lines = <?=$n_lines?>;
		var scroll_page = 5;
		var address0 = <?=EXE_CS_ADDRESS?>;
		var PAGE = <?=PAGE?>;
		var exe = [<?=implode($code_seg, ', ')?>];
		var data = [<?=implode($date_seg, ', ')?>];
	</script>
	<script src="asm_table.js" type="text/javascript"></script>
	<script src="asm.js" type="text/javascript"></script>
	<script src="index.js" type="text/javascript"></script>
	<script src="ds.js" type="text/javascript"></script>
</body>
</html>