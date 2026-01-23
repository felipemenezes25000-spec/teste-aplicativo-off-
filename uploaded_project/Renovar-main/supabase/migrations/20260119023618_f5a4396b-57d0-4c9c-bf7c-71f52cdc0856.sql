-- Create function to insert notification on status change
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  target_user_id UUID;
  request_type_label TEXT;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Determine the request type label
  IF TG_TABLE_NAME = 'prescription_requests' THEN
    request_type_label := 'Receita';
  ELSIF TG_TABLE_NAME = 'exam_requests' THEN
    request_type_label := 'Exame';
  ELSIF TG_TABLE_NAME = 'consultation_requests' THEN
    request_type_label := 'Consulta';
  END IF;

  -- Build notification based on new status
  CASE NEW.status
    WHEN 'analyzing' THEN
      notification_title := request_type_label || ' em análise';
      notification_message := 'Sua solicitação está sendo analisada por um médico.';
      target_user_id := NEW.patient_id;
    WHEN 'approved' THEN
      notification_title := request_type_label || ' aprovada';
      notification_message := 'Sua solicitação foi aprovada! O documento está disponível para download.';
      target_user_id := NEW.patient_id;
    WHEN 'rejected' THEN
      notification_title := request_type_label || ' rejeitada';
      notification_message := 'Sua solicitação foi rejeitada. Verifique os detalhes.';
      target_user_id := NEW.patient_id;
    WHEN 'correction_needed' THEN
      notification_title := 'Correção necessária';
      notification_message := 'O médico solicitou correções na sua ' || LOWER(request_type_label) || '.';
      target_user_id := NEW.patient_id;
    ELSE
      RETURN NEW;
  END CASE;

  -- Insert the notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (target_user_id, notification_title, notification_message, 'info');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for each request table
DROP TRIGGER IF EXISTS prescription_status_notify ON public.prescription_requests;
CREATE TRIGGER prescription_status_notify
  AFTER UPDATE ON public.prescription_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_status_change();

DROP TRIGGER IF EXISTS exam_status_notify ON public.exam_requests;
CREATE TRIGGER exam_status_notify
  AFTER UPDATE ON public.exam_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_status_change();

DROP TRIGGER IF EXISTS consultation_status_notify ON public.consultation_requests;
CREATE TRIGGER consultation_status_notify
  AFTER UPDATE ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_status_change();