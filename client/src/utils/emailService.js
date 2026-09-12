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
    from_name: assignedByName || 'System Admin',
    assigned_by: assignedByName || 'System Admin',
    to_name: executive.name,
    assigned_to: executive.name,
    to_email: executive.email,
    customer_name: lead.name,
    customer_phone: lead.phone,
    project_code: lead.projectCode || 'N/A',
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
    from_name: assignedByName || 'System Admin',
    assigned_by: assignedByName || 'System Admin',
    to_name: assignedPerson.name || 'Team Member',
    assigned_to: assignedPerson.name || 'Team Member',
    to_email: assignedPerson.email,
    task_title: task.title || 'Untitled Task',
    task_description: task.description || 'No description provided.',
    priority: task.priority || 'Medium',
    department: task.category || task.department || 'General',
    project_name: task.projectName || 'N/A',
    due_date: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A',
    assigned_date: new Date().toLocaleDateString('en-GB'),
    task_url: taskUrl || window.location.href
  };

  console.log('Attempting to send Task Assignment EmailJS notification:', { serviceId, templateId, publicKey, templateParams });

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Task assignment email sent successfully!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send task assignment email. EmailJS Error Details:', {
      status: error?.status,
      text: error?.text,
      message: error?.message,
      error
    });
    return null;
  }
};

/**
 * Sends a notification email to the assignee whenever the task status changes.
 */
export const sendTaskStatusChangeEmail = async (assignee, task, updatedByName, previousStatus, newStatus, taskUrl) => {
  const serviceId = SERVICE_ID;
  const templateId = TASK_TEMPLATE_ID;
  const publicKey = PUBLIC_KEY;

  if (!assignee?.email) {
    console.warn('Cannot send task status email: Assignee email is missing.');
    return;
  }

  const prevText = previousStatus ? ` (Previous status: ${previousStatus})` : '';
  
  let descriptionText = `Task status has been updated to "${newStatus}" by ${updatedByName || 'Assigned Person'}.${prevText}\n\nTask details: ${task.description || 'No description provided.'}`;
  if (newStatus === 'Closed') {
    descriptionText = `Your task "${task.title || 'Untitled Task'}" has been closed by ${updatedByName || 'Assigned Person'}.${prevText}\n\nTask details: ${task.description || 'No description provided.'}`;
  } else if (newStatus === 'Reopened' || (newStatus === 'New' && task.isReopened)) {
    descriptionText = `Your task "${task.title || 'Untitled Task'}" was reviewed and reopened by ${updatedByName || 'Assigned Person'}. Status has been set back to New.\n\nTask details: ${task.description || 'No description provided.'}`;
  }

  const templateParams = {
    from_name: updatedByName || 'System Admin',
    assigned_by: updatedByName || 'System Admin',
    to_name: assignee.name || 'Team Member',
    assigned_to: assignee.name || 'Team Member',
    to_email: assignee.email,
    task_title: `[Status: ${newStatus}] ${task.title || 'Untitled Task'}`,
    task_description: descriptionText,
    priority: task.priority || 'Medium',
    department: task.category || task.department || 'General',
    project_name: task.projectName || 'N/A',
    due_date: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A',
    assigned_date: new Date().toLocaleDateString('en-GB'),
    task_url: taskUrl || `${window.location.origin}/tasks-board`
  };

  console.log('Attempting to send Task Status Change EmailJS notification:', { serviceId, templateId, publicKey, templateParams });

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Task status update email sent successfully!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send task status update email:', error);
    return null;
  }
};

/**
 * Sends a notification email with the reply text to the intended recipient.
 */
export const sendTaskReplyEmail = async (recipient, task, replyNote, senderName, attachmentsCount = 0, taskUrl) => {
  const serviceId = SERVICE_ID;
  const templateId = TASK_TEMPLATE_ID;
  const publicKey = PUBLIC_KEY;

  if (!recipient?.email) {
    console.warn('Cannot send task reply email: Recipient email is missing.');
    return;
  }

  let desc = `New reply from ${senderName || 'Team Member'}:\n\n"${replyNote || '(Attachment only)'}"`;
  if (attachmentsCount > 0) {
    desc += `\n\n[${attachmentsCount} file attachment(s) included]`;
  }
  desc += `\n\nTask: ${task.title || 'Task'}`;

  const templateParams = {
    from_name: senderName || 'Team Member',
    assigned_by: senderName || 'Team Member',
    to_name: recipient.name || 'Team Member',
    assigned_to: recipient.name || 'Team Member',
    to_email: recipient.email,
    task_title: `[New Reply] ${task.title || 'Task'}`,
    task_description: desc,
    priority: task.priority || 'Medium',
    department: task.category || task.department || 'General',
    project_name: task.projectName || 'N/A',
    due_date: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A',
    assigned_date: new Date().toLocaleDateString('en-GB'),
    task_url: taskUrl || `${window.location.origin}/tasks-board`
  };

  console.log('Attempting to send Task Reply EmailJS notification:', { serviceId, templateId, publicKey, templateParams });

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Task reply email sent successfully!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send task reply email:', error);
    return null;
  }
};
