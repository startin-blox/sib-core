@builtin "whitespace.ne"
@builtin "string.ne"

@{%
const nul = () => null
%}

Main => FieldsString {%
([a])=>a
%}

FieldsString -> 
Named (Comma Named):*
{%
data => data.flat(2).filter(d => d !== null)
%}

Named -> (NamedField | NamedSet) {% ([[a]])=>a %}

NamedField -> Field (As Name):? {%
([field,n])=> ({
	name: n ? n[1] : field.join('.'),
	path: field
})
%}

NamedSet -> Set As Name {%
([set,_,name])=> ({name, set})
%}

Field -> Name (Dot Name):* {% 
a => a.flat(2).filter(b => b !== null)
%}

Set -> "(" _ FieldsString _ ")" {% a  => a[2] %}

Name -> 
[a-zA-Z0-9_-]:+ {%([a])=>a.join('')%}
| (dqstring
| sqstring) {% ([[a]])=>a %}

Dot -> "." {% nul %}

As -> __ "as"i __ {% nul %}

Comma => _ "," _ {% nul %}