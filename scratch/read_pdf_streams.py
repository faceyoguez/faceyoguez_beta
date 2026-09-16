import sys
import re
import zlib

def extract_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as f:
        content = f.read()

    # Find streams
    stream_objs = re.findall(b'stream\r?\n(.*?)\r?\nendstream', content, re.DOTALL)
    
    all_extracted_text = []
    for s in stream_objs:
        try:
            decompressed = zlib.decompress(s)
            # Find Tj or TJ text blocks
            # e.g., (text) Tj or [(text1) 10 (text2)] TJ
            strings = re.findall(rb'\((.*?)\)\s*(?:Tj|TJ|\')', decompressed)
            for st in strings:
                try:
                    all_extracted_text.append(st.decode('latin1'))
                except:
                    pass
            # Also catch raw strings in arrays [(...)]
            arrays = re.findall(rb'\[(.*?)\]\s*TJ', decompressed)
            for arr in arrays:
                sub_strs = re.findall(rb'\((.*?)\)', arr)
                for st in sub_strs:
                    try:
                        all_extracted_text.append(st.decode('latin1'))
                    except:
                        pass
        except Exception as e:
            pass

    return all_extracted_text

print("==========================================")
print("PDF 1: Rashmi_FaceRoutine_1_6.pdf")
print("==========================================")
txt1 = extract_text_from_pdf('scratch/Rashmi_FaceRoutine_1_6.pdf')
print('\n'.join(txt1))

print("\n==========================================")
print("PDF 2: BODYWORKS_NEW.pdf")
print("==========================================")
txt2 = extract_text_from_pdf('scratch/BODYWORKS_NEW.pdf')
print('\n'.join(txt2))
