-- Enable the pgvector extension
create extension if not exists vector;

-- Create the documents table
-- The embedding size is 768 because we are using the text-embedding-004 model from Google.
create table documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768)
);

-- Create a function to match documents
create function match_documents (
  query_embedding vector(768),
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
