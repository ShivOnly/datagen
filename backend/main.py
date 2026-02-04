import json
from typing import List, Dict, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import get_settings, Settings
from synthetic_engine import generate_dataset
from groq import Groq

app = FastAPI()

# Specifically allow your Next.js port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Field(BaseModel):
    name: str
    description: Optional[str] = ""
    useAI: bool = True

class GenRequest(BaseModel):
    description: str
    country: str
    rows: int
    fields: List[Field]

@app.post("/suggest-schema")
async def suggest_schema(description: str, settings: Settings = Depends(get_settings)):
    client = Groq(api_key=settings.groq_api_key)
    prompt = f"Dataset goal: {description}. Suggest max {settings.max_columns} fields. Return JSON with 'fields' (name, description, useAI) and 'global_reasoning'."
    try:
        completion = client.chat.completions.create(
            model=settings.model_name,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_data(req: GenRequest, settings: Settings = Depends(get_settings)):
    try:
        dataset = generate_dataset(
            fields=[f.dict() for f in req.fields], 
            count=settings.max_rows, 
            description=req.description, 
            locale=req.country,
            api_key=settings.groq_api_key,
            model=settings.model_name
        )
        # Ensure 'dataset' is a List of Dictionaries
        return dataset 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))