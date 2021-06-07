function callback_about(e){
	document.getElementById("about_page").className = "subpage";
	document.getElementById("contact_page").className = "subpage subpage_hidden";
	document.getElementById("projects_page").className = "subpage subpage_hidden";
	document.getElementById("pictures_page").className = "subpage subpage_hidden";
}

function callback_contact(e){
	document.getElementById("about_page").className = "subpage subpage_hidden";
	document.getElementById("contact_page").className = "subpage";
	document.getElementById("projects_page").className = "subpage subpage_hidden";
	document.getElementById("pictures_page").className = "subpage subpage_hidden";
}

function callback_projects(e){
	document.getElementById("about_page").className = "subpage subpage_hidden";
	document.getElementById("contact_page").className = "subpage subpage_hidden";
	document.getElementById("projects_page").className = "subpage";
	document.getElementById("pictures_page").className = "subpage subpage_hidden";
}

function callback_pictures(e){
	document.getElementById("about_page").className = "subpage subpage_hidden";
	document.getElementById("contact_page").className = "subpage subpage_hidden";
	document.getElementById("projects_page").className = "subpage subpage_hidden";
	document.getElementById("pictures_page").className = "subpage";
}

