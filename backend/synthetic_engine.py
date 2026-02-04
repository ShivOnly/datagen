import json, random
from groq import Groq

def generate_dataset(fields, count, description, locale, api_key, model):
    client = Groq(api_key=api_key)
    context_fields = [f['name'] for f in fields if "id" not in f['name'].lower()]
    
    # Strict prompt emphasizing variety and uniqueness
    prompt = f"""
    Dataset Subject: {description} (Context: {locale})
    Count: Generate exactly {count} rows.
    Fields: {', '.join(context_fields)}

    STRICT RULES:
    1. NO DUPLICATES: Each row must be unique and distinct. Do not repeat the same entity (e.g., if subject is planets, include {count} different planets/celestial bodies).
    2. VARIETY: Ensure a wide range of values for attributes like 'Radius', 'Mass', and 'Name'.
    3. LANGUAGE: English Only.
    4. FORMAT: Return ONLY a JSON object with a "rows" key.
    """

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8, # Increased temperature to encourage diversity
            response_format={"type": "json_object"}
        )
        ai_rows = json.loads(completion.choices[0].message.content).get('rows', [])
    except Exception:
        ai_rows = []

    # Final assembly with local duplication check
    final_data = []
    seen_entities = set()

    for i in range(count):
        row = {}
        # Attempt to find a unique row from AI output
        row_context = {}
        for candidate in ai_rows:
            # Use the first column (usually Name) as the unique identifier
            entity_id = str(list(candidate.values())[0]) if candidate else str(i)
            if entity_id not in seen_entities:
                row_context = candidate
                seen_entities.add(entity_id)
                break
        
        # Fallback if AI failed to provide enough unique rows
        if not row_context and ai_rows:
            row_context = ai_rows[i % len(ai_rows)]

        for f in fields:
            name = f['name']
            if "id" in name.lower():
                row[name] = str(random.randint(100000, 999999))
            else:
                row[name] = row_context.get(name, "Unique Data Required")
        final_data.append(row)
        
    return final_data