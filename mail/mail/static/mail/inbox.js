document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document
    .querySelector('#inbox')
    .addEventListener('click', () => load_mailbox('inbox'));
  document
    .querySelector('#sent')
    .addEventListener('click', () => load_mailbox('sent'));
  document
    .querySelector('#archived')
    .addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //Submit
  document
    .querySelector('#compose-form')
    .addEventListener('submit', send_email);
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id) {
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      // Print emails

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-detail-view').style.display = 'block';

      document.querySelector('#email-detail-view').innerHTML = `
      <ul class="list-group">
      <li class="list-group-item"><strong>From:</strong>${email.sender}</li>
      <li class="list-group-item"><strong>To:</strong>${email.recipients}</li>
      <li class="list-group-item"><strong>Subject:</strong>${email.subject}</li>
      <li class="list-group-item"><strong>Timestamp:</strong>${email.timestamp}</li>
      <li class="list-group-item">${email.body}</li>
    </ul>
      `;

      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true,
          }),
        });
      }

      //Archive
      const btn_arc = document.createElement('button');
      btn_arc.innerHTML = !email.archived ? 'Archive' : 'Unarchived';
      btn_arc.className = email.archived ? 'btn btn-danger' : 'btn btn-success';
      btn_arc.addEventListener('click', function () {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived,
          }),
        }).then(() => {
          load_mailbox('inbox');
        });
      });
      document.querySelector('#email-detail-view').append(btn_arc);

      //Reply
      const btn_rep = document.createElement('button');
      btn_rep.innerHTML = 'Reply';
      btn_rep.className = 'btn btn-info';
      btn_rep.addEventListener('click', function () {
        compose_email();
        document.querySelector('#compose-recipients').value = email.sender;
        let subject = email.subject;
        if (subject.split(' ', 1)[0] != 'Re:') {
          subject = 'Re: ' + email.subject;
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector(
          '#compose-body'
        ).value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      });
      document.querySelector('#email-detail-view').append(btn_rep);
    });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Print result
      emails.forEach((oEmail) => {
        console.log(oEmail);

        const newMail = document.createElement('div');
        newMail.className = 'list-group-item';
        newMail.className = oEmail.read ? 'read' : 'unread';

        newMail.innerHTML = `
        <h5>Sender: ${oEmail.sender}</h5>
        <h4>Subject: ${oEmail.subject}</h4>
        <p>${oEmail.timestamp}</p>
        `;

        newMail.addEventListener('click', view_email(oEmail.id));
        document.querySelector('#emails-view').append(newMail);
      });
    });
}

function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  }).then((response) => load_mailbox('sent'));
}
