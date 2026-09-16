import base64
import zlib
import re

def process_pdf(pdf_path, name):
    print(f"\n==========================================")
    print(f"PDF: {name} ({pdf_path})")
    print(f"==========================================")

    with open(pdf_path, 'rb') as f:
        data = f.read()

    idx = 0
    stream_idx = 1
    while True:
        pos = data.find(b'stream', idx)
        if pos == -1:
            break
        end_pos = data.find(b'endstream', pos)
        if end_pos == -1:
            end_pos = len(data)

        raw_chunk = data[pos+6:end_pos].strip()

        # Try zlib direct
        text_found = False
        try:
            dec = zlib.decompress(raw_chunk)
            print_text(dec, stream_idx)
            text_found = True
        except:
            pass

        if not text_found:
            # Try ascii85 then zlib
            try:
                clean = raw_chunk
                if not clean.endswith(b'~>'):
                    clean = clean + b'~>'
                a85 = base64.a85decode(clean, adobe=True)
                dec = zlib.decompress(a85)
                print_text(dec, stream_idx)
            except Exception as e:
                pass

        stream_idx += 1
        idx = pos + 6

def print_text(decompressed_bytes, stream_idx):
    # Extract string tokens inside ( ... ) Tj or Tj/TL
    # Also extract raw text inside parenthesis
    matches = re.findall(rb'\((.*?)\)\s*(?:Tj|TJ|\')', decompressed_bytes)
    lines = []
    for m in matches:
        try:
            s = m.decode('latin1')
            # clean escaped chars
            s = s.replace('\\227', '—').replace('\\(', '(').replace('\\)', ')')
            if s.strip():
                lines.append(s)
        except:
            pass

    if lines:
        print(f"\n--- Stream {stream_idx} ---")
        for line in lines:
            print(line)

process_pdf('scratch/Rashmi_FaceRoutine_1_6.pdf', 'Rashmi Face Routine 1/6')
process_pdf('scratch/BODYWORKS_NEW.pdf', 'Bodyworks New')
