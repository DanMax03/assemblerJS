<?php
	include 'inc.php';
	$n_lines = min(20, CODE_PAGE);

	$cs_str = substr(file_get_contents(TASK_EXE_FULL_PATH), EXE_CS_OFFSET, CODE_PAGE);
	$code_seg = array();
	for($i = 0; $i < strlen($cs_str); ++$i)
		$code_seg[] = ord($cs_str[$i]);

	// пример
	//$code_seg = array(); for($i = 0; $i < CODE_PAGE; ++$i) $code_seg[] = 0x90; 
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
	
	$date_seg_str = substr(file_get_contents(TASK_EXE_FULL_PATH), EXE_DS_OFFSET, DATA_PAGE);
	$date_seg = array();
	for($i = 0; $i < strlen($date_seg_str); ++$i)
		$date_seg[] = ord($date_seg_str[$i]);

	$ds_lines = intdiv(DATA_PAGE + 15, 16);
	$maxlen_datatext = DATA_PAGE + $ds_lines;
	$maxlen_datacode = DATA_PAGE * 3 + $ds_lines;
	$ds_addresses = array();
	for($i = 0; $i < intdiv(DATA_PAGE - 1 + 16, 16); ++$i)
		$ds_addresses[] = hex(EXE_DS_ADDRESS + $i * 16, 4);
	$ds_addresses = implode("\n", $ds_addresses);
?>
<!doctype html>
<html>
<head>
	<title>Ассемблер</title>
	<link href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap" rel="stylesheet">
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="index.css"></link>
	<script src="jquery.min.js" type="text/javascript"></script>
	<script src="typed.js" type="text/javascript"></script>
</head>
<body style="font-size:100%; line-height: 1.6875;">
	<form method='post' action='get_exe.php' target='_blank' class='get_exe' id="exe-button" >
			<input type='text' name='cs_str' id='cs_str' value=''>
			<input type='text' name='ds_str' id='ds_str' value=''>
			<input type='submit' value='.exe' id="inside-exe-button">
	</form>
	<div id="logo-block">
		<img src="new-logo.svg" alt="" id="logo"> 
		<div id="buttons-block">
			<button onclick="show_window_exemples()"id="exemples-button">Примеры программ</button>
			<button onclick="show_window_insructions()"id="insructions-button">Справочник по инструкциям</button>
			<button onclick="show_window_tips()"id="tips-button">FAQ</button>
		</div>
	</div>
	<div id="main_background">
	<div class='segment code'><fieldset>
			<legend>Сегмент кода</legend>
			<div id="menu-segment-1">
				<div id="flex-box">
					<a id="commands-buttom" class="commands-buttom" ><p>Справка по кнопочкам</p></a>
					<a href='#' id='copy_asm2textarea' class="commands-buttom" title='Скопировать программу в поле memo'> <p>Скопировать программу в поле</p> </a>
					<a href='#' id='copy_textarea2asm' class="commands-buttom" title='Скопировать программу из поля memo'> <p>Скопировать программу из поля</p></a>
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
					<textarea id='asm_text'>Asm Text...</textarea>
					<div class='error'>
						<table><thead></thead><tbody></tbody></table></div>
					</div>
				</div>
			</div>
		</fieldset></div>
		
		<div class='segmentdata'><fieldset>
			<legend>Сегмент данных</legend>
			<textarea cols=7 rows=1 readonly class='noframe' id="nof-one" disabled></textarea>
			<textarea cols=47 rows=1 readonly class='noframe1' disabled>00 01 02 03 04 05 06 07  08 09 0a 0b 0c 0d 0e 0f</textarea>
			<textarea cols=15 rows=1 readonly class='noframe' id="nof-two" disabled>0123456789abcdef</textarea>
			<br>
			<textarea cols=7 rows=<?=$ds_lines + 1?> readonly class='noframe' id="nof-zero" disabled><?=$ds_addresses?></textarea>
			<textarea cols=47 rows=<?=$ds_lines + 1?> id='ds_bytes' maxlength=<?=$maxlen_datacode?>></textarea>
			<textarea cols=15 rows=<?=$ds_lines + 1?> id='ds_text' maxlength=<?=$maxlen_datatext?>></textarea>
			<div contenteditable id= "warrning-1">Для переключением между режимами вставки и замены поставьте курсор сюда<br>и нажмите на клавиатуре клавишу Insert</div>
		</fieldset></div>

		<div class='segment test'><fieldset method='post' action='<?=TEST_EXE?>' class='test_exe'>
			<legend>Тестирование</legend>
<?php include 'select.inc.html'; ?>
			<a id='mccme_task_link' target='_blank'>Условие задачи</a>
			<input type='submit' value='Протестировать' id="test-button">
			<p>Результат:</p>
			<table>
				<thead>
					<tr><th>N</th><th>input</th><th>expected</th><th>got</th><th>status</th></tr>
				</thead>
				<tbody>
				</tbody>
			</table>
		</fieldset></div>
	</div>
	<script>
		'use strict';
		var n_lines = <?=$n_lines?>;
		var scroll_page = 5;
		var address0 = <?=EXE_CS_ADDRESS?>;
		var CODE_PAGE = <?=CODE_PAGE?>;
		var DATA_PAGE = <?=DATA_PAGE?>;
		var exe = [<?=implode($code_seg, ', ')?>];
		var data = [<?=implode($date_seg, ', ')?>];
		var task_id = <?=intval(@$_GET['task_id'])?>;
	</script>
	<script src="asm_table.js" type="text/javascript"></script>
	<script src="asm.js" type="text/javascript"></script>
	<script src="index.js" type="text/javascript"></script>
	<script src="ds.js" type="text/javascript"></script>
	<script src="test_exe.js" type="text/javascript"></script>
</body>
</html>