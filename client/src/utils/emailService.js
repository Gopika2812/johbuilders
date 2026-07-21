import emailjs from '@emailjs/browser';

/**
 * Sends an assignment email notification to the registration email of the executive.
 * 
 * @param {Object} executive - The assigned executive employee object
 * @param {string} executive.name - Name of the executive
 * @param {string} executive.email - Registration email address of the executive
 * @param {Object} lead - The lead details object
 * @param {string} lead.name - Customer's name
 * @param {string} lead.phone - Customer's phone number
 * @param {string} [lead.projectCode] - Project code (e.g. 'JMD')
 * @param {string} assignedByName - Name of the logged-in user who assigned this lead
 * @param {string} [senderEmail] - Email of the logged-in admin (for Reply-To)
 */
export const sendLeadAssignmentEmail = async (executive, lead, assignedByName, senderEmail) => {
  const serviceId = 'service_hxy9k36';
  const templateId = 'template_9pz7cyd';
  const publicKey = '6pVsb0P0NBgl9TG6h';

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

  console.log('Attempting to send EmailJS assignment notification with config:', {
    serviceId,
    templateId,
    publicKey,
    templateParams
  });

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Lead assignment notification email sent successfully!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send lead assignment notification email. Check your EmailJS Key/Template settings on your EmailJS dashboard:', error);
    throw error;
  }
};
