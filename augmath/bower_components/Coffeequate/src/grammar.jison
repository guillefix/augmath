%lex

%%
\s+				/* skip whitespace */
[\-]?[0-9]+e[\-+]?[0-9]+	return 'TERMINAL'; /* scientific notation */
[^()+\-*/]+					return 'TERMINAL';
"**"						return '**';
"*"							return '*';
"/"							return '/';
"+"							return '+';
"-"							return '-';
"("							return '(';
")" 						return ')';
<<EOF>>						return 'EOF';

/lex

/* precedence */

%left '+' '-'
%left '*' '/'
%left '**'
%left NEGATE

% start expressions

%% /* language grammar */

expressions

	: e EOF {return $1;};

e	: e '+' e {$$ = ["+",$1,$3];}
	| e '-' e {$$ = ["-",$1,$3];}
	| e '*' e {$$ = ["*",$1,$3];}
	| e '/' e {$$ = ["/",$1,$3];}
	| e '**' e {$$ = ["**",$1,$3];}
	| '-' e %prec NEGATE {$$ = ["*","-1",$2];}
	| '(' e ')' {$$ = $2;}
	| TERMINAL {$$ = yytext.trim();}
	;