import re

def count_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    
    stack = []
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        for m in re.finditer(r'<div\b(?![^>]*?/>)', line):
            stack.append(i)
        
        for m in re.finditer(r'</div>', line):
            if stack:
                stack.pop()
            else:
                print(f"Extra closing div at L{i}")
    
    if stack:
        print(f"UNBALANCED! {len(stack)} tags left open:")
        for line in stack:
            print(f"  <div> at line {line}")
    else:
        print("All divs balanced!")

count_tags(r'd:\OneStone\Faceyoguez-main\faceyoguez_beta\app\(dashboard)\instructor\groups\InstructorGroupClient.tsx')
