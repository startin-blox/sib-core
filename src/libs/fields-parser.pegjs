Main = FieldsString

FieldsString = 
first:Named next:(Comma n:FieldsString { return n })*
{return [first].concat(next[0] || [])}

Named = NamedField / NamedSet

NamedField = field:Field name:(As n:Name {return n})?
{return {
	name: name||field.join('.'),
	path: field
}}

NamedSet = set:Set As name:Name 
{return {name, set}}

Field = a:(Name (Dot Name)*) 
{return a.flat(2).filter(b => b !== null)}

Set = 
"(" _ f:FieldsString _ ")" 
{ return f }

Name = $ ( !([() ,.]) . )+

Dot = "." {return null}

As = __ "as"i __ 

Comma = _ "," _ 

__ = [ \t\n]+

_ = [ \t\n]*