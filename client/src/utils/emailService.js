import emailjs from '@emailjs/browser';

// EmailJS Configuration - Set from environment variables or default configured values
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_9x5jdkk';
const LEAD_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_LEAD_TEMPLATE_ID || 'template_rbvokan';
const TASK_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TASK_TEMPLATE_ID || 'template_rbvokan';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'ntcvQswd9MSe7rCLx';

/**
 * Sends an assignment email notification to the registration email of the executive for Leads.
 */
export const sendLeadAssignmentEmail = async (executive, lead, assignedByName, senderEmail) => {
  const serviceId = SERVICE_ID;
  const templateId = LEAD_TEMPLATE_ID;
  const publicKey = PUBLIC_KEY;

  if (!executive?.email) {
    console.warn('Cannot send lead assignment email: Executive email is missing.');
    return;
  }

  const templateParams = {
    to_name: executive.name,
    to_email: executive.email,
    customer_name: lead.name,
    customer_phone: lead.phone,
    project_code: lead.projectCode || 'N/A',
    assigned_by: assignedByName || 'System Admin',
    assigned_date: new Date().toLocaleDateString('en-GB'),
    reply_to_email: senderEmail || 'admin@builders.com'
  };

  console.log('Attempting to send Lead EmailJS notification:', { serviceId, templateId, publicKey, templateParams });

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Lead assignment notification email sent successfully!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send lead assignment notification email. Check your EmailJS Key/Template settings:', error);
    throw error;
  }
};
/**
 * Sends a Task Assignment email notification to the registered email of the assigned person.
 * 
 * @param {Object} assignedPerson - Assigned employee object ({ name, email })
 * @param {Object} task - Task details object ({ title, description, priority, category, projectName, dueDate })
 * @param {string} assignedByName - Name of the user who assigned the task
 * @param {string} [taskUrl] - Direct URL to the task page
 */
export const sendTaskAssignmentEmail = async (assignedPerson, task, assignedByName, taskUrl) => {
  const serviceId = SERVICE_ID;
  const templateId = TASK_TEMPLATE_ID;
  const publicKey = PUBLIC_KEY;

  if (!assignedPerson?.email) {
    console.warn('Cannot send task assignment email: Assigned person registered email is missing.');
    return;
  }

  const templateParams = {
    to_name: assignedPerson.name || 'Team Member',
    to_email: assignedPerson.email,
    task_title: task.title || 'Untitled Task',
    task_description: task.description || 'No description provided.',
    priority: task.priority || 'Medium',
    department: task.category || task.department || 'General',
    project_name: task.projectName || 'N/A',
    due_date: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A',
    assigned_by: assignedByName || 'System Admin',
    assigned_date: new Date().toLocaleDateString('en-GB'),
    task_url: taskUrl || window.location.href
  };

  console.log('Attempting to send Task Assignment EmailJS notification:', { serviceId, templateId, publicKey, templateParams });

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Task assignment email sent successfully!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send task assignment email. Check your EmailJS credentials:', error);
    // Don't throw error to prevent blocking task creation flow if email fails
    return null;
  }
};
