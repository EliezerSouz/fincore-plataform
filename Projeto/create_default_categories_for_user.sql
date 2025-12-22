

BEGIN
  INSERT INTO public.categories (
    user_id,
    name,
    type,
    icon,
    color,
    is_active
  )
  VALUES
    (NEW.id, 'Transferência', 'despesa', 'arrow-right-left', '#3b82f6', true),
    (NEW.id, 'Transferência', 'receita', 'arrow-right-left', '#3b82f6', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
