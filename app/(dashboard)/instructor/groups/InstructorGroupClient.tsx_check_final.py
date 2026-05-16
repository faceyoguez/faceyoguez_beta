import re

def count_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Remove comments
    content = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    
    # 2. Extract all tags with their line numbers
    # Ignore tags that look like types (any, string, HTMLInputElement)
    ignore_tags = ['any', 'string', 'HTMLInputElement', 'number', 'boolean', 'Student', 'Batch', 'Message', 'StudentResource']
    
    lines = content.split('\n')
    all_tags = []
    for i, line in enumerate(lines, 1):
        matches = re.finditer(r'<(/?[a-zA-Z][a-zA-Z0-9]*)([^>]*?)(/?)>', line)
        for m in matches:
            tag_name = m.group(1)
            is_closing = tag_name.startswith('/')
            actual_name = tag_name[1:] if is_closing else tag_name
            
            if actual_name in ignore_tags:
                continue
                
            is_self_closing = m.group(3) == '/'
            
            if is_closing:
                all_tags.append(('close', actual_name, i))
            elif is_self_closing:
                all_tags.append(('self', actual_name, i))
            else:
                if actual_name.lower() in ['img', 'input', 'br', 'hr', 'meta', 'link']:
                    all_tags.append(('self', actual_name, i))
                else:
                    all_tags.append(('open', actual_name, i))
    
    stack = []
    for type, name, line in all_tags:
        if type == 'open':
            stack.append((name, line))
        elif type == 'close':
            if not stack:
                print(f"L{line}: Extra closing tag: </{name}>")
            else:
                top_name, top_line = stack.pop()
                if top_name != name:
                    print(f"L{line}: Mismatched tag: expected </{top_name}> (from L{top_line}), got </{name}>")
    
    if stack:
        print(f"UNBALANCED! {len(stack)} tags left open:")
        for name, line in stack:
            print(f"  <{name}> at line {line}")
    else:
        print("All tags balanced!")

count_tags(r'd:\OneStone\Faceyoguez-main\faceyoguez_beta\app\(dashboard)\instructor\groups\InstructorGroupClient.tsx')
