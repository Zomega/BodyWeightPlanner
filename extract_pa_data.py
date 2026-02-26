import json
import pdfplumber


def is_red(char):
    """
    Checks if a character is 'red'. 
    Colors in pdfplumber are often (R, G, B) where each component is 0-1.
    Red is usually high R, low G, low B.
    """
    # Non-stroking color is usually what we want for text fill
    color = char.get("non_stroking_color")
    if not color:
        return False

    # DeviceRGB: (R, G, B)
    if len(color) == 3:
        r, g, b = color
        # Typical red: R > 0.8, G < 0.2, B < 0.2
        return r > 0.7 and g < 0.3 and b < 0.3

    # Other color spaces (like DeviceCMYK) might appear, but usually it's RGB
    return False


def extract_pdf_data(pdf_path, output_json_path):
    all_data = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            # We extract words with their character data to check colors
            # However, extract_words doesn't give colors directly easily.
            # Better approach: Group characters into lines manually or use a hybrid approach.

            # Let's use page.extract_text() for structure and then cross-reference codes with red characters.
            # But simpler: scan the page for all "words" and if a word looks like a code (5 digits),
            # check if its characters are red.

            words = page.extract_words(extra_attrs=["non_stroking_color"])

            # Since the layout is strictly tabular (Heading | Code | MET | Description),
            # we can iterate through the words and try to re-assemble the rows.
            # A more robust way given the complexity of multi-line descriptions:
            # Sort words by top position, then left.

            rows = []
            current_y = None
            current_row_words = []

            # Tolerant vertical grouping (threshold for same line)
            threshold = 2

            for w in words:
                if current_y is None or abs(w['top'] - current_y) < threshold:
                    current_row_words.append(w)
                    current_y = w['top']
                else:
                    rows.append(current_row_words)
                    current_row_words = [w]
                    current_y = w['top']
            if current_row_words:
                rows.append(current_row_words)

            for row in rows:
                row_text = " ".join([w['text'] for w in row])

                # Skip header
                if "Major Heading" in row_text and "Activity Code" in row_text:
                    continue

                # We expect Heading, Code (5 digits), MET (float), Description...
                # Let's find the code word.
                code_idx = -1
                for i, w in enumerate(row):
                    if w['text'].isdigit() and len(w['text']) == 5:
                        code_idx = i
                        break

                if code_idx != -1:
                    code_word = row[code_idx]
                    code = code_word['text']

                    # Check if this code was red
                    # In pdfplumber, 'extra_attrs' ensures 'non_stroking_color' is present
                    is_estimated = is_red(code_word)

                    # MET is usually the next numeric value
                    met = None
                    description_start_idx = code_idx + 2

                    if code_idx + 1 < len(row):
                        try:
                            met_text = row[code_idx + 1]['text']
                            met = float(met_text)
                        except ValueError:
                            pass

                    if met is not None:
                        heading = " ".join([w['text'] for w in row[:code_idx]])
                        description = " ".join(
                            [w['text'] for w in row[description_start_idx:]])

                        all_data.append({
                            "heading": heading.strip(),
                            "code": code,
                            "met": met,
                            "description": description.strip(),
                            "is_estimated": is_estimated
                        })

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)

    print(
        f"Extraction complete. Found {len(all_data)} entries. Saved to {output_json_path}")


if __name__ == "__main__":
    extract_pdf_data("pa_compendium_2024.pdf", "pa_compendium_2024.json")
