import re
import os

def process_file():
    input_file = 'u644556995_job.sql'
    
    with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        
    # Process Companies
    # Lines 769 to 1713
    # 769 is INSERT INTO
    process_table(lines, 769, 1713, 'Companies', '"Companies"', 
                  ['"id"', '"name"', '"date"', '"solutions_available"', '"created_at"', '"updated_at"'],
                  'companies_seed')

    # Process Questions
    # Lines 31569 to 34690
    questions_cols = ['"id"', '"company_id"', '"title"', '"google_doc_link"', '"problem_statement"', 
                      '"solution_cpp"', '"solution_python"', '"solution_java"', 
                      '"pregiven_code_cpp"', '"pregiven_code_python"', '"pregiven_code_java"', 
                      '"difficulty"', '"question_type"', '"premium_required"', 
                      '"created_at"', '"updated_at"', '"solution_code"', '"solution"', 
                      '"pregiven_code"', '"input_test_case"', '"output_test_case"', '"lc_tags"']
                      
    process_table(lines, 31569, 34690, 'Questions', '"Questions"', questions_cols, 'questions_seed')

def process_table(lines, start_line, end_line, table_name, table_quoted, columns, output_prefix):
    # Extract lines
    # start_line is 1-based index of INSERT INTO ...
    # end_line is 1-based index of last row (ending with ;)
    
    insert_line_idx = start_line - 1
    # data starts after insert line
    # end_line is the line number of the last data row.
    # slice [start:end] includes start, excludes end.
    # We want lines[insert_line_idx+1] to lines[end_line_idx-1] (indices).
    # line number L -> index L-1.
    # We want up to line end_line. index end_line-1.
    # So slice up to end_line.
    
    data_lines = lines[insert_line_idx+1:end_line] 
    
    batch_size = 50
    current_batch = []
    part = 1
    
    # Header for insert
    cols_str = ", ".join(columns)
    insert_header = f'INSERT INTO {table_quoted} ({cols_str}) VALUES\n'
    
    for i, line in enumerate(data_lines):
        # clean line
        line = line.strip()
        if not line: continue
        
        # Replace \' with '' (escape single quotes for Postgres)
        line = line.replace("\\'", "''")
        
        # Handle boolean logic specific to table
        if table_name == 'Companies':
            # Replace `, 0, ` with `, false, ` etc for solutions_available
            # Pattern: `', (0|1), '20`
             line = re.sub(r"', (0|1), '", lambda m: f"', {'true' if m.group(1)=='1' else 'false'}, '", line)
             
        if table_name == 'Questions':
            # premium_required conversion
            # Pattern: matches `, 0, '` or `, 1, '` before date.
            # usually `', (0|1), '20` works.
            line = re.sub(r"', (0|1), '", lambda m: f"', {'true' if m.group(1)=='1' else 'false'}, '", line)
            
        # Remove trailing comma or semicolon
        if line.endswith(',') or line.endswith(';'):
            line = line[:-1]
            
        current_batch.append(line)
        
        if len(current_batch) >= batch_size:
            write_batch(output_prefix, part, insert_header, current_batch)
            current_batch = []
            part += 1
            
    if current_batch:
        write_batch(output_prefix, part, insert_header, current_batch)

def write_batch(prefix, part, header, rows):
    filename = f'{prefix}_part{part}.sql'
    with open(filename, 'w') as f:
        f.write(header)
        # Join rows with comma and newline
        f.write(",\n".join(rows))
        f.write(";\n")
        
if __name__ == '__main__':
    process_file()
