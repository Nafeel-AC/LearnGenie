-- Enhanced Supabase Schema for AI Tutor System with Multiformat & Web Scraping Support

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Enhanced Books table with multiformat and web scraping support
CREATE TABLE public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    
    -- File information
    file_size INTEGER,
    file_type TEXT DEFAULT 'unknown' CHECK (file_type IN (
        'pdf', 'word', 'excel', 'powerpoint', 'text', 
        'image', 'audio', 'web', 'unknown'
    )),
    format_details TEXT, -- e.g., "PDF Document", "Web Content (Trafilatura)"
    
    -- Document-specific metadata
    page_count INTEGER,
    sheet_count INTEGER, -- For Excel files
    slide_count INTEGER, -- For PowerPoint files
    paragraph_count INTEGER, -- For Word documents
    table_count INTEGER, -- For Word documents with tables
    character_count INTEGER, -- For text files
    line_count INTEGER, -- For text files
    row_count INTEGER, -- For CSV files
    
    -- Web scraping specific fields
    url_source TEXT, -- Original URL for web scraped content
    author TEXT, -- Article author
    publish_date TIMESTAMP WITH TIME ZONE, -- Article publication date
    description TEXT, -- Meta description or summary
    keywords TEXT, -- Extracted keywords (comma-separated)
    extraction_method TEXT, -- trafilatura, newspaper3k, beautifulsoup
    
    -- Image/Audio specific fields
    image_size TEXT, -- e.g., "1920x1080"
    image_mode TEXT, -- e.g., "RGB", "RGBA"
    duration_seconds NUMERIC, -- For audio files
    encoding TEXT, -- File encoding (e.g., "utf-8")
    
    -- Processing status
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed')),
    error_message TEXT, -- Store processing errors
    pinecone_namespace TEXT UNIQUE,
    
    -- Timestamps
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Chat histories table
CREATE TABLE public.chat_histories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    
    -- Additional metadata for chat context
    sources JSONB, -- Store source information for RAG responses
    metadata JSONB, -- Additional context data
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- New table for MCQ (Multiple Choice Questions) storage
CREATE TABLE public.mcqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Store as JSON array
    correct_answer TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics table for analytics
CREATE TABLE public.system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type TEXT NOT NULL, -- 'upload', 'chat', 'mcq_generation', etc.
    metric_data JSONB NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_books_user_id ON public.books(user_id);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_file_type ON public.books(file_type);
CREATE INDEX idx_books_url_source ON public.books(url_source) WHERE url_source IS NOT NULL;
CREATE INDEX idx_books_upload_date ON public.books(upload_date);
CREATE INDEX idx_books_processed_date ON public.books(processed_date) WHERE processed_date IS NOT NULL;

CREATE INDEX idx_conversations_book_id ON public.conversations(book_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);

CREATE INDEX idx_chat_histories_conversation_id ON public.chat_histories(conversation_id);
CREATE INDEX idx_chat_histories_book_id ON public.chat_histories(book_id);
CREATE INDEX idx_chat_histories_user_id ON public.chat_histories(user_id);
CREATE INDEX idx_chat_histories_created_at ON public.chat_histories(created_at);

CREATE INDEX idx_mcqs_book_id ON public.mcqs(book_id);
CREATE INDEX idx_mcqs_user_id ON public.mcqs(user_id);
CREATE INDEX idx_mcqs_difficulty ON public.mcqs(difficulty);

CREATE INDEX idx_system_metrics_type ON public.system_metrics(metric_type);
CREATE INDEX idx_system_metrics_created_at ON public.system_metrics(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Books policies
CREATE POLICY "Users can view own books" ON public.books
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON public.books
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON public.books
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON public.books
    FOR DELETE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Chat histories policies
CREATE POLICY "Users can view own chat histories" ON public.chat_histories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat histories" ON public.chat_histories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat histories" ON public.chat_histories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat histories" ON public.chat_histories
    FOR DELETE USING (auth.uid() = user_id);

-- MCQs policies
CREATE POLICY "Users can view own mcqs" ON public.mcqs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mcqs" ON public.mcqs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mcqs" ON public.mcqs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mcqs" ON public.mcqs
    FOR DELETE USING (auth.uid() = user_id);

-- System metrics policies (read-only for users, admin access needed for writes)
CREATE POLICY "Users can view own metrics" ON public.system_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert metrics" ON public.system_metrics
    FOR INSERT WITH CHECK (true); -- Allow system to insert metrics

-- Functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content statistics
CREATE OR REPLACE FUNCTION public.get_user_content_stats(user_uuid UUID)
RETURNS TABLE (
    total_documents INTEGER,
    documents_by_type JSONB,
    total_conversations INTEGER,
    total_mcqs INTEGER,
    storage_used BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_documents,
        json_build_object(
            'pdf', COUNT(*) FILTER (WHERE file_type = 'pdf'),
            'word', COUNT(*) FILTER (WHERE file_type = 'word'),
            'excel', COUNT(*) FILTER (WHERE file_type = 'excel'),
            'powerpoint', COUNT(*) FILTER (WHERE file_type = 'powerpoint'),
            'text', COUNT(*) FILTER (WHERE file_type = 'text'),
            'image', COUNT(*) FILTER (WHERE file_type = 'image'),
            'web', COUNT(*) FILTER (WHERE file_type = 'web'),
            'other', COUNT(*) FILTER (WHERE file_type = 'unknown')
        ) as documents_by_type,
        (SELECT COUNT(*)::INTEGER FROM public.conversations WHERE user_id = user_uuid) as total_conversations,
        (SELECT COUNT(*)::INTEGER FROM public.mcqs WHERE user_id = user_uuid) as total_mcqs,
        COALESCE(SUM(file_size), 0)::BIGINT as storage_used
    FROM public.books 
    WHERE user_id = user_uuid AND status = 'processed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_timestamp_books
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_timestamp_conversations
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Views for easier querying
CREATE VIEW public.user_content_overview AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    COUNT(b.id) as total_documents,
    COUNT(c.id) as total_conversations,
    COUNT(m.id) as total_mcqs,
    COALESCE(SUM(b.file_size), 0) as total_storage_bytes,
    u.created_at as user_since
FROM public.users u
LEFT JOIN public.books b ON u.id = b.user_id AND b.status = 'processed'
LEFT JOIN public.conversations c ON u.id = c.user_id
LEFT JOIN public.mcqs m ON u.id = m.user_id
GROUP BY u.id, u.email, u.full_name, u.created_at; 