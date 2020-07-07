'use strict';

// http://ref.x86asm.net/#Instruction-Operand-Codes - description of some types
/*
	sreg - segment register
	moffs - only MOV (a0, a1, a2, a3), [disp] without size
*/

/*
	template guide:
	
	1. Possible opcode template:
	
	
	--------
	
	
	------dw, where
	d is direction bit (d = 0 -> from REG to R/M, else from R/M to REG)
	w is width bit (w = 0 -> operands has 8 bit size, else - 32/16 bit size)
	
	
	-------w
	
	
	---sr---, where // only 1 byte commands
	sr - segment register
	
	
	-----reg, where // only 1 byte commands
	reg - general purpose register (GPR)
	
	
	----wreg
	
	
	------s-, where
	s - sign bit, if s = 0 it means that the constant operand is the same size as first
				  else it means that the constant operand is one byte size that is sign
				  extended to the size of the first operand
				  
	
	----cond, where
	cond - condition, setup of flags in some consequence
*/

/*
{'-------w', '----cond', '---sr---', '--------', '------s-', '----wreg', '-----reg', '------dw', '------sw', '------d-', '-----fpu'}
****************************************
{'data(2/4)', 'data(1)', 'data(2)'} switched into data(4) ...
****************************************
{'addr(4/6)', 'addr(2/4)', 'addr(1)'} switched into addr(6) addr(4)...
****************************************
{'', 'addr', 'data', 'j'}
*/

/*
	Types of operands:
	r8
	r16
	r16/32
	m
	m8
	m16
	m16/32
	m16:16/32 // only les, lds
	m16/32&16/32 // only bound
	r/m8
	r/m16
	r/m16/32
	eax ecx edx ebx esp ebp esi edi
	ax cx dx di si bp
	al cl dl bl ah ch dh bh
	es cs ss ds
	imm8
	imm16
	imm16/32
	flags // pushf, popf, iret
	eflags // bound, int 3, int imm8, into
	sreg // only MOV instructions
	ptr16:16/32 // only CALL and JMP instructions
	moffs8 // only MOV instructions
	moffs16/32
	3
	1
	rel8
	rel16/32

	r, m, imm, sreg, ptr, moffs
*/

var cmd_mas =[
	'00 add 2 0 reg_value=r op1=r/m8 op2=r8 ------dw mrm',
	'01 add 2 0 reg_value=r op1=r/m16/32 op2=r16/32 ------dw mrm',
	'02 add 2 0 reg_value=r op1=r8 op2=r/m8 ------dw mrm',
	'03 add 2 0 reg_value=r op1=r16/32 op2=r/m16/32 ------dw mrm',
	'04 add 2 0 op1=al op2=imm8 -------w data(1)',
	'05 add 2 0 op1=eax op2=imm16/32 -------w data(4)',
	'06 push 1 0 op1=es ---sr---',
	'07 pop 1 0 op1=es ---sr---',
	'08 or 2 0 reg_value=r op1=r/m8 op2=r8 ------dw mrm',
	'09 or 2 0 reg_value=r op1=r/m16/32 op2=r16/32 ------dw mrm',
	'0a or 2 0 reg_value=r op1=r8 op2=r/m8 ------dw mrm',
	'0b or 2 0 reg_value=r op1=r16/32 op2=r/m16/32 ------dw mrm',
	'0c or 2 0 op1=al op2=imm8 -------w data(1)',
	'0d or 2 0 op1=eax op2=imm16/32 -------w data(4)',
	'0e push 1 0 op1=cs ---sr---',
	'10 adc 2 0 reg_value=r op1=r/m8 op2=r8 ------dw mrm',
	'11 adc 2 0 reg_value=r op1=r/m16/32 op2=r16/32 ------dw mrm',
	'12 adc 2 0 reg_value=r op1=r8 op2=r/m8 ------dw mrm',
	'13 adc 2 0 reg_value=r op1=r16/32 op2=r/m16/32 ------dw mrm',
	'14 adc 2 0 op1=al op2=imm8 -------w data(1)',
	'15 adc 2 0 op1=eax op2=imm16/32 -------w data(4)',
	'16 push 1 0 op1=ss ---sr---',
	'17 pop 1 0 op1=ss ---sr---',
	'18 sbb 2 0 reg_value=r op1=r/m8 op2=r8 ------dw mrm',
	'19 sbb 2 0 reg_value=r op1=r/m16/32 op2=r16/32 ------dw mrm',
	'1a sbb 2 0 reg_value=r op1=r8 op2=r/m8 ------dw mrm',
	'1b sbb 2 0 reg_value=r op1=r16/32 op2=r/m16/32 ------dw mrm',
	'1c sbb 2 0 op1=al op2=imm8 -------w data(1)',
	'1d sbb 2 0 op1=eax op2=imm16/32 -------w data(4)',
	'1e push 1 0 op1=ds ---sr---',
	'1f pop 1 0 op1=ds ---sr---',
	'20 and 2 0 reg_value=r op1=r/m8 op2=r8 ------dw mrm',
	'21 and 2 0 reg_value=r op1=r/m16/32 op2=r16/32 ------dw mrm',
	'22 and 2 0 reg_value=r op1=r8 op2=r/m8 ------dw mrm',
	'23 and 2 0 reg_value=r op1=r16/32 op2=r/m16/32 ------dw mrm',
	'24 and 2 0 op1=al op2=imm8 -------w data(1)',
	'25 and 2 0 op1=eax op2=imm16/32 -------w data(4)',
	'27 daa 0 0 op1=al --------',
	'28 sub 2 0 reg_value=r op1=r/m8 op2=r8 ------dw mrm',
	'29 sub 2 0 reg_value=r op1=r/m16/32 op2=r16/32 ------dw mrm',
	'2a sub 2 0 reg_value=r op1=r8 op2=r/m8 ------dw mrm',
	'2b sub 2 0 reg_value=r op1=r16/32 op2=r/m16/32 ------dw mrm',
	'2c sub 2 0 op1=al op2=imm8 -------w data(1)',
	'2d sub 2 0 op1=eax op2=imm16/32 -------w data(4)',
	'2f das 0 0 op1=al --------',
	'30 xor 2 0 reg_value=r op1=r/m8 op2=r8 ------dw mrm',
	'31 xor 2 0 reg_value=r op1=r/m16/32 op2=r16/32 ------dw mrm',
	'32 xor 2 0 reg_value=r op1=r8 op2=r/m8 ------dw mrm',
	'33 xor 2 0 reg_value=r op1=r16/32 op2=r/m16/32 ------dw mrm',
	'34 xor 2 0 op1=al op2=imm8 -------w data(1)',
	'35 xor 2 0 op1=eax op2=imm16/32 -------w data(4)',
	'37 aaa 0 0 op1=al op2=ah --------',
	'38 cmp 2 0 reg_value=r op1=r/m8 op2=r8 ------dw mrm',
	'39 cmp 2 0 reg_value=r op1=r/m16/32 op2=r16/32 ------dw mrm',
	'3a cmp 2 0 reg_value=r op1=r8 op2=r/m8 ------dw mrm',
	'3b cmp 2 0 reg_value=r op1=r16/32 op2=r/m16/32 ------dw mrm',
	'3c cmp 2 0 op1=al op2=imm8 -------w data(1)',
	'3d cmp 2 0 op1=eax op2=imm16/32 -------w data(4)',
	'3f aas 0 0 op1=al op2=ah --------',
	'40 inc 1 0 op1=eax -----reg',
	'41 inc 1 0 op1=ecx -----reg',
	'42 inc 1 0 op1=edx -----reg',
	'43 inc 1 0 op1=ebx -----reg',
	'44 inc 1 0 op1=esp -----reg',
	'45 inc 1 0 op1=ebp -----reg',
	'46 inc 1 0 op1=esi -----reg',
	'47 inc 1 0 op1=edi -----reg',
	'48 dec 1 0 op1=eax -----reg',
	'49 dec 1 0 op1=ecx -----reg',
	'4a dec 1 0 op1=edx -----reg',
	'4b dec 1 0 op1=ebx -----reg',
	'4c dec 1 0 op1=esp -----reg',
	'4d dec 1 0 op1=ebp -----reg',
	'4e dec 1 0 op1=esi -----reg',
	'4f dec 1 0 op1=edi -----reg',
	'50 push 1 0 op1=eax -----reg',
	'51 push 1 0 op1=ecx -----reg',
	'52 push 1 0 op1=edx -----reg',
	'53 push 1 0 op1=ebx -----reg',
	'54 push 1 0 op1=esp -----reg',
	'55 push 1 0 op1=ebp -----reg',
	'56 push 1 0 op1=esi -----reg',
	'57 push 1 0 op1=edi -----reg',
	'58 pop 1 0 op1=eax -----reg',
	'59 pop 1 0 op1=ecx -----reg',
	'5a pop 1 0 op1=edx -----reg',
	'5b pop 1 0 op1=ebx -----reg',
	'5c pop 1 0 op1=esp -----reg',
	'5d pop 1 0 op1=ebp -----reg',
	'5e pop 1 0 op1=esi -----reg',
	'5f pop 1 0 op1=edi -----reg',
	'60 pusha 0 0 op1=ax op2=cx op3=dx --------',
	'61 popa 0 0 op1=di op2=si op3=bp --------',
	'62 bound 2 0 reg_value=r op1=r16/32 op2=m16/32&16/32 op3=eflags -------- mrm',
	'63 arpl 2 0 reg_value=r op1=r/m16 op2=r16 -------- mrm',
	'68 push 1 0 op1=imm16/32 ------s- data(4)',
	'69 imul 3 0 reg_value=r op1=r16/32 op2=r/m16/32 op3=imm16/32 ------s- mrm data(4)',
	'6a push 1 0 op1=imm8 ------s- data(1)',
	'6b imul 3 0 reg_value=r op1=r16/32 op2=r/m16/32 op3=imm8 ------s- mrm data(1)',
	'6c ins 2 0 op1=m8 op2=dx -------w',
	'6d ins 2 0 op1=m16/32 op2=dx -------w',
	'6e outs 2 0 op1=dx op2=m8 -------w',
	'6f outs 2 0 op1=dx op2=m16/32 -------w',
	'70 jo 1 0 op1=rel8 ----cond addr(1)',
	'71 jno 1 0 op1=rel8 ----cond addr(1)',
	'72 jb 1 0 op1=rel8 ----cond addr(1)',
	'73 jnb 1 0 op1=rel8 ----cond addr(1)',
	'74 jz 1 0 op1=rel8 ----cond addr(1)',
	'75 jnz 1 0 op1=rel8 ----cond addr(1)',
	'76 jbe 1 0 op1=rel8 ----cond addr(1)',
	'77 jnbe 1 0 op1=rel8 ----cond addr(1)',
	'78 js 1 0 op1=rel8 ----cond addr(1)',
	'79 jns 1 0 op1=rel8 ----cond addr(1)',
	'7a jp 1 0 op1=rel8 ----cond addr(1)',
	'7b jnp 1 0 op1=rel8 ----cond addr(1)',
	'7c jl 1 0 op1=rel8 ----cond addr(1)',
	'7d jnl 1 0 op1=rel8 ----cond addr(1)',
	'7e jle 1 0 op1=rel8 ----cond addr(1)',
	'7f jnle 1 0 op1=rel8 ----cond addr(1)',
	'80 adc 2 0 reg_value=2 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'80 add 2 0 reg_value=0 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'80 and 2 0 reg_value=4 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'80 cmp 2 0 reg_value=7 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'80 or 2 0 reg_value=1 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'80 sbb 2 0 reg_value=3 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'80 sub 2 0 reg_value=5 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'80 xor 2 0 reg_value=6 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'81 adc 2 0 reg_value=2 op1=r/m16/32 op2=imm16/32 ------sw nnn data(4)',
	'81 add 2 0 reg_value=0 op1=r/m16/32 op2=imm16/32 ------sw nnn data(4)',
	'81 and 2 0 reg_value=4 op1=r/m16/32 op2=imm16/32 ------sw nnn data(4)',
	'81 cmp 2 0 reg_value=7 op1=r/m16/32 op2=imm16/32 ------sw nnn data(4)',
	'81 or 2 0 reg_value=1 op1=r/m16/32 op2=imm16/32 ------sw nnn data(4)',
	'81 sbb 2 0 reg_value=3 op1=r/m16/32 op2=imm16/32 ------sw nnn data(4)',
	'81 sub 2 0 reg_value=5 op1=r/m16/32 op2=imm16/32 ------sw nnn data(4)',
	'81 xor 2 0 reg_value=6 op1=r/m16/32 op2=imm16/32 ------sw nnn data(4)',
	'82 adc 2 0 reg_value=2 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'82 add 2 0 reg_value=0 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'82 and 2 0 reg_value=4 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'82 cmp 2 0 reg_value=7 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'82 or 2 0 reg_value=1 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'82 sbb 2 0 reg_value=3 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'82 sub 2 0 reg_value=5 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'82 xor 2 0 reg_value=6 op1=r/m8 op2=imm8 ------sw nnn data(1)',
	'83 adc 2 0 reg_value=2 op1=r/m16/32 op2=imm8 ------sw nnn data(1)',
	'83 add 2 0 reg_value=0 op1=r/m16/32 op2=imm8 ------sw nnn data(1)',
	'83 and 2 0 reg_value=4 op1=r/m16/32 op2=imm8 ------sw nnn data(1)',
	'83 cmp 2 0 reg_value=7 op1=r/m16/32 op2=imm8 ------sw nnn data(1)',
	'83 or 2 0 reg_value=1 op1=r/m16/32 op2=imm8 ------sw nnn data(1)',
	'83 sbb 2 0 reg_value=3 op1=r/m16/32 op2=imm8 ------sw nnn data(1)',
	'83 sub 2 0 reg_value=5 op1=r/m16/32 op2=imm8 ------sw nnn data(1)',
	'83 xor 2 0 reg_value=6 op1=r/m16/32 op2=imm8 ------sw nnn data(1)',
	'84 test 2 0 reg_value=r op1=r/m8 op2=r8 -------w mrm',
	'85 test 2 0 reg_value=r op1=r/m16/32 op2=r16/32 -------w mrm',
	'86 xchg 2 0 reg_value=r op1=r8 op2=r/m8 -------w mrm',
	'87 xchg 2 0 reg_value=r op1=r16/32 op2=r/m16/32 -------w mrm',
	'88 mov 2 0 reg_value=r op1=r/m8 op2=r8 ------dw mrm',
	'89 mov 2 0 reg_value=r op1=r/m16/32 op2=r16/32 ------dw mrm',
	'8a mov 2 0 reg_value=r op1=r8 op2=r/m8 ------dw mrm',
	'8b mov 2 0 reg_value=r op1=r16/32 op2=r/m16/32 ------dw mrm',
	'8c mov 2 0 reg_value=r op1=m16 op2=sreg ------d- mrm',
	'8d lea 2 0 reg_value=r op1=r16/32 op2=m -------- mrm',
	'8e mov 2 0 reg_value=r op1=sreg op2=r/m16 ------d- mrm',
	'8f pop 1 0 reg_value=0 op1=r/m16/32 -------- nnn',
	'90 nop 0 0 --------',
//  '90 xchg op1=eax op2=eax -----reg',
	'91 xchg 1 0 op1=ecx op2=eax -----reg',
	'92 xchg 1 0 op1=edx op2=eax -----reg',
	'93 xchg 1 0 op1=ebx op2=eax -----reg',
	'94 xchg 1 0 op1=esp op2=eax -----reg',
	'95 xchg 1 0 op1=ebp op2=eax -----reg',
	'96 xchg 1 0 op1=esi op2=eax -----reg',
	'97 xchg 1 0 op1=edi op2=eax -----reg',
//  '98 cbw op1=ax op2=al --------',
	'98 cwde 0 0 op1=eax op2=ax --------', 
	'99 cdq 0 0 op1=edx op2=eax --------',
//	'99 cwd op1=dx op2=ax --------',
	'9a call 1 0 op1=ptr16:16/32 -------- addr(6)',
	'9b wait 0 0 --------',
	'9c pushf 0 0 op1=flags --------',
	'9d popf 0 0 op1=flags --------',
	'9e sahf 0 0 op1=ah --------',
	'9f lahf 0 0 op1=ah --------',
	'a0 mov 2 0 op1=al op2=moffs8 ------dw addr(4)',
	'a1 mov 2 0 op1=eax op2=moffs16/32 ------dw addr(4)',
	'a2 mov 2 0 op1=moffs8 op2=al ------dw addr(4)',
	'a3 mov 2 0 op1=moffs16/32 op2=eax ------dw addr(4)',
	'a4 movs 2 0 op1=m8 op2=m8 -------w',
//	'a5 movs 2 0 op1=m16 op2=m16 -------w',
	'a5 movs 2 0 op1=m16/32 op2=m16/32 -------w',
	'a6 cmps 2 0 op1=m8 op2=m8 -------w',
//	'a7 cmps 2 0 op1=m16 op2=m16 -------w',
	'a7 cmps 2 0 op1=m16/32 op2=m16/32 -------w',
	'a8 test 2 0 op1=al op2=imm8 -------w data(1)',
	'a9 test 2 0 op1=eax op2=imm16/32 -------w data(4)',
	'aa stos 2 0 op1=m8 op2=al -------w',
//	'ab stos 2 0 op1=m16 op2=ax -------w',
	'ab stos 2 0 op1=m16/32 op2=eax -------w',
	'ac lods 2 0 op1=al op2=m8 -------w',
//	'ad lods 2 0 op1=ax op2=m16 -------w',
	'ad lods 2 0 op1=eax op2=m16/32 -------w',
	'ae scas 2 0 op1=m8 op2=al -------w',
//	'af scas 2 0 op1=m16 op2=ax -------w',
	'af scas 2 0 op1=m16/32 op2=eax -------w',
	'b0 mov 2 0 op1=al op2=imm8 ----wreg data(1)',
	'b1 mov 2 0 op1=cl op2=imm8 ----wreg data(1)',
	'b2 mov 2 0 op1=dl op2=imm8 ----wreg data(1)',
	'b3 mov 2 0 op1=bl op2=imm8 ----wreg data(1)',
	'b4 mov 2 0 op1=ah op2=imm8 ----wreg data(1)',
	'b5 mov 2 0 op1=ch op2=imm8 ----wreg data(1)',
	'b6 mov 2 0 op1=dh op2=imm8 ----wreg data(1)',
	'b7 mov 2 0 op1=bh op2=imm8 ----wreg data(1)',
	'b8 mov 2 0 op1=eax op2=imm16/32 ----wreg data(4)',
	'b9 mov 2 0 op1=ecx op2=imm16/32 ----wreg data(4)',
	'ba mov 2 0 op1=edx op2=imm16/32 ----wreg data(4)',
	'bb mov 2 0 op1=ebx op2=imm16/32 ----wreg data(4)',
	'bc mov 2 0 op1=esp op2=imm16/32 ----wreg data(4)',
	'bd mov 2 0 op1=ebp op2=imm16/32 ----wreg data(4)',
	'be mov 2 0 op1=esi op2=imm16/32 ----wreg data(4)',
	'bf mov 2 0 op1=edi op2=imm16/32 ----wreg data(4)',
	'c0 rcl 2 0 reg_value=2 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'c0 rcr 2 0 reg_value=3 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'c0 rol 2 0 reg_value=0 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'c0 ror 2 0 reg_value=1 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'c0 sal 2 0 reg_value=6 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'c0 sar 2 0 reg_value=7 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'c0 shl 2 0 reg_value=4 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'c0 shr 2 0 reg_value=5 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'c1 rcl 2 0 reg_value=2 op1=r/m16/32 op2=imm8 -------w nnn data(1)',
	'c1 rcr 2 0 reg_value=3 op1=r/m16/32 op2=imm8 -------w nnn data(1)',
	'c1 rol 2 0 reg_value=0 op1=r/m16/32 op2=imm8 -------w nnn data(1)',
	'c1 ror 2 0 reg_value=1 op1=r/m16/32 op2=imm8 -------w nnn data(1)',
	'c1 sal 2 0 reg_value=6 op1=r/m16/32 op2=imm8 -------w nnn data(1)',
	'c1 sar 2 0 reg_value=7 op1=r/m16/32 op2=imm8 -------w nnn data(1)',
	'c1 shl 2 0 reg_value=4 op1=r/m16/32 op2=imm8 -------w nnn data(1)',
	'c1 shr 2 0 reg_value=5 op1=r/m16/32 op2=imm8 -------w nnn data(1)',
	'c2 ret 1 0 op1=imm16 -------- data(2)',
	'c3 ret 0 0 --------',
	'c4 les 2 1 reg_value=r op1=es op2=r16/32 op3=m16:16/32 -------- mrm',
	'c5 lds 2 1 reg_value=r op1=ds op2=r16/32 op3=m16:16/32 -------- mrm',
	'c6 mov 2 0 reg_value=0 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'c7 mov 2 0 reg_value=0 op1=r/m16/32 op2=imm16/32 -------w nnn data(4)',
	'c8 enter 2 1 op1=ebp op2=imm16 op3=imm8 -------- data(2) data(1)',
	'c9 leave 0 0 op1=ebp --------',
	'cc int3 0 0 op1=3 op2=eflags --------',
	'cd int 1 0 op1=imm8 op2=eflags -------- data(1)',
	'ce into 0 0 op1=eflags --------',
	'cf iret 0 0 op1=flags --------',
	'd0 rcl 2 0 reg_value=2 op1=r/m8 op2=1 -------w nnn',
	'd0 rcr 2 0 reg_value=3 op1=r/m8 op2=1 -------w nnn',
	'd0 rol 2 0 reg_value=0 op1=r/m8 op2=1 -------w nnn',
	'd0 ror 2 0 reg_value=1 op1=r/m8 op2=1 -------w nnn',
	'd0 sal 2 0 reg_value=6 op1=r/m8 op2=1 -------w nnn',
	'd0 sar 2 0 reg_value=7 op1=r/m8 op2=1 -------w nnn',
	'd0 shl 2 0 reg_value=4 op1=r/m8 op2=1 -------w nnn',
	'd0 shr 2 0 reg_value=5 op1=r/m8 op2=1 -------w nnn',
	'd1 rcl 2 0 reg_value=2 op1=r/m16/32 op2=1 -------w nnn',
	'd1 rcr 2 0 reg_value=3 op1=r/m16/32 op2=1 -------w nnn',
	'd1 rol 2 0 reg_value=0 op1=r/m16/32 op2=1 -------w nnn',
	'd1 ror 2 0 reg_value=1 op1=r/m16/32 op2=1 -------w nnn',
	'd1 sal 2 0 reg_value=6 op1=r/m16/32 op2=1 -------w nnn',
	'd1 sar 2 0 reg_value=7 op1=r/m16/32 op2=1 -------w nnn',
	'd1 shl 2 0 reg_value=4 op1=r/m16/32 op2=1 -------w nnn',
	'd1 shr 2 0 reg_value=5 op1=r/m16/32 op2=1 -------w nnn',
	'd2 rcl 2 0 reg_value=2 op1=r/m8 op2=cl -------w nnn',
	'd2 rcr 2 0 reg_value=3 op1=r/m8 op2=cl -------w nnn',
	'd2 rol 2 0 reg_value=0 op1=r/m8 op2=cl -------w nnn',
	'd2 ror 2 0 reg_value=1 op1=r/m8 op2=cl -------w nnn',
	'd2 sal 2 0 reg_value=6 op1=r/m8 op2=cl -------w nnn',
	'd2 sar 2 0 reg_value=7 op1=r/m8 op2=cl -------w nnn',
	'd2 shl 2 0 reg_value=4 op1=r/m8 op2=cl -------w nnn',
	'd2 shr 2 0 reg_value=5 op1=r/m8 op2=cl -------w nnn',
	'd3 rcl 2 0 reg_value=2 op1=r/m16/32 op2=cl -------w nnn',
	'd3 rcr 2 0 reg_value=3 op1=r/m16/32 op2=cl -------w nnn',
	'd3 rol 2 0 reg_value=0 op1=r/m16/32 op2=cl -------w nnn',
	'd3 ror 2 0 reg_value=1 op1=r/m16/32 op2=cl -------w nnn',
	'd3 sal 2 0 reg_value=6 op1=r/m16/32 op2=cl -------w nnn',
	'd3 sar 2 0 reg_value=7 op1=r/m16/32 op2=cl -------w nnn',
	'd3 shl 2 0 reg_value=4 op1=r/m16/32 op2=cl -------w nnn',
	'd3 shr 2 0 reg_value=5 op1=r/m16/32 op2=cl -------w nnn',
	'd4 aam 0 0 op1=al op2=ah -------- 00001010',
	'd5 aad 0 0 op1=al op2=ah -------- 00001010',
	'd6 salc 0 0 op1=al --------',
	'd7 xlat 1 1 op1=al op2=m8 --------',
	'e0 loopnz 1 1 op1=ecx op2=rel8 -------- addr(1)',
	'e1 loopz 1 1 op1=ecx op2=rel8 -------- addr(1)',
	'e2 loop 1 1 op1=ecx op2=rel8 -------- addr(1)',
	'e3 jecxz 1 0 op1=rel8 op2=cx -------- addr(1)',
	'e4 in 2 0 op1=al op2=imm8 -------w data(1)',
	'e5 in 2 0 op1=eax op2=imm8 -------w data(1)',
	'e6 out 2 0 op1=imm8 op2=al -------w data(1)',
	'e7 out 2 0 op1=imm8 op2=eax -------w data(1)',
	'e8 call 1 0 op1=rel16/32 -------- addr(4)',
	'e9 jmp 1 0 op1=rel16/32 -------- addr(4)',
	'ea jmp 1 0 op1=ptr16:16/32 -------- addr(6)',
	'eb jmp 1 0 op1=rel8 -------- addr(1)',
	'ec in 2 0 op1=al op2=dx -------w',
	'ed in 2 0 op1=eax op2=dx -------w',
	'ee out 2 0 op1=dx op2=al -------w',
	'ef out 2 0 op1=dx op2=eax -------w',
	'f4 hlt 0 0 --------',
	'f5 cmc 0 0 --------',
	'f6 div 1 3 reg_value=6 op1=al op2=ah op3=ax -------w nnn',
	'f6 idiv 1 3 reg_value=7 op1=al op2=ah op3=ax -------w nnn',
	'f6 imul 1 2 reg_value=5 op1=ax op2=al op3=r/m8 -------w nnn',
	'f6 mul 1 2 reg_value=4 op1=ax op2=al op3=r/m8 -------w nnn',
	'f6 neg 1 0 reg_value=3 op1=r/m8 -------w nnn',
	'f6 not 1 0 reg_value=2 op1=r/m8 -------w nnn',
	'f6 test 2 0 reg_value=0 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'f6 test 2 0 reg_value=1 op1=r/m8 op2=imm8 -------w nnn data(1)',
	'f7 div 1 2 reg_value=6 op1=edx op2=eax op3=r/m16/32 -------w nnn',
	'f7 idiv 1 2 reg_value=7 op1=edx op2=eax op3=r/m16/32 -------w nnn',
	'f7 imul 1 2 reg_value=5 op1=edx op2=eax op3=r/m16/32 -------w nnn',
	'f7 mul 1 2 reg_value=4 op1=edx op2=eax op3=r/m16/32 -------w nnn',
	'f7 neg 1 0 reg_value=3 op1=r/m16/32 -------w nnn',
	'f7 not 1 0 reg_value=2 op1=r/m16/32 -------w nnn',
	'f7 test 2 0 reg_value=0 op1=r/m16/32 op2=imm16/32 -------w nnn data(4)',
	'f7 test 2 0 reg_value=1 op1=r/m16/32 op2=imm16/32 -------w nnn data(4)',
	'f8 clc 0 0 --------',
	'f9 stc 0 0 --------',
	'fa cli 0 0 --------',
	'fb sti 0 0 --------',
	'fc cld 0 0 --------',
	'fd std 0 0 --------',
	'fe dec 1 0 reg_value=1 op1=r/m8 -------w nnn',
	'fe inc 1 0 reg_value=0 op1=r/m8 -------w nnn',
	'ff call 1 0 reg_value=2 op1=r/m16/32 -------- nnn',
	'ff dec 1 0 reg_value=1 op1=r/m16/32 -------w nnn',
	'ff inc 1 0 reg_value=0 op1=r/m16/32 -------w nnn',
	'ff jmp 1 0 reg_value=4 op1=r/m16/32 -------- nnn',
	'ff push 1 0 reg_value=6 op1=r/m16/32 -------- nnn',
];

var disasm_map = {};
var asm_map = {};

(function () 
{
	var code;
	
	// Creating asm_map
	var space1, space2;
	var cmd;
	for (var i = 0; i < cmd_mas.length; i++) {
		space1 = cmd_mas[i].indexOf(' ');
		space2 = cmd_mas[i].indexOf(' ', 3);
		
		cmd = cmd_mas[i].substring(space1 + 1, space2);
		
		if (asm_map[cmd] == undefined) {
			asm_map[cmd] = [cmd_mas[i].substring(0, space1) + cmd_mas[i].substring(space2)]; // code true_op_count op_start reg_value? op1? op2? op3? temp
		} else {
			asm_map[cmd].push(cmd_mas[i].substring(0, space1) + cmd_mas[i].substring(space2));
		}
	}
	
	// Creating disasm_map
	
	for (var i = 0; i < cmd_mas.length; i++) {
		code = cmd_mas[i].substr(0, 2);
		
		if (disasm_map[code] == undefined)
			disasm_map[code] = [cmd_mas[i].substring(3)]; // cmd true_op_count op_start reg_value? op1? op2? op3? temp
		else
			disasm_map[code].push(cmd_mas[i].substring(3));
		
	}
	
	//console.log(disasm_map);
}) ();