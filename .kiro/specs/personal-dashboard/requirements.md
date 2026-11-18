# Requirements Document

## Introduction

The Personal Dashboard is a client-side web application that helps a single user manage daily productivity. The Dashboard aggregates four widgets into a single page: a Greeting that shows the current time, date, and a time-appropriate greeting; a Focus Timer that runs a 25-minute countdown with start, stop, and reset controls; a Task List that supports adding, editing, completing, and deleting tasks; and Quick Links that open favorite websites. The application is built with HTML, a single CSS file, and a single vanilla JavaScript file, with no backend server and no frontend frameworks. All persistent data is stored in the browser Local Storage, so the Dashboard can run as a standalone web app or a browser extension and can be deployed through GitHub Pages.

## Glossary

- **Dashboard**: The Personal Dashboard web application as a whole.
- **Greeting_Widget**: The Dashboard component that displays the current time, date, and a greeting.
- **Focus_Timer**: The Dashboard component that runs a 25-minute countdown and exposes start, stop, and reset controls.
- **Task_List**: The Dashboard component that stores and displays to-do items.
- **Task**: A single to-do item that has a text description and a completion status.
- **Quick_Links_Widget**: The Dashboard component that renders buttons for favorite websites and opens them on activation.
- **Quick_Link**: A single saved favorite-website entry containing a display name and a URL.
- **Local_Storage**: The browser Web Storage API used to persist Dashboard data on the client.
- **Task_Entry**: The input control used to enter new Task text into the Task_List.
- **Modern_Browser**: A current version of Chrome, Firefox, Edge, or Safari.

## Requirements

### Requirement 1: Greeting Time and Date Display

**User Story:** As a user, I want to see the current time and date, so that I can orient myself when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in 12-hour format including hours, minutes, and seconds with an AM or PM indicator, updating at least once per second.
2. THE Greeting_Widget SHALL display the current local date including the day of week, full month name, numeric day, and four-digit year.
3. WHEN the local time crosses midnight, THE Greeting_Widget SHALL update the displayed date within one second.

### Requirement 2: Time-Based Greeting

**User Story:** As a user, I want a greeting that matches the time of day, so that the Dashboard feels personal.

#### Acceptance Criteria

1. WHILE the local time is from 05:00:00 through 11:59:59 inclusive, THE Greeting_Widget SHALL display the text "Good morning".
2. WHILE the local time is from 12:00:00 through 16:59:59 inclusive, THE Greeting_Widget SHALL display the text "Good afternoon".
3. WHILE the local time is from 17:00:00 through 20:59:59 inclusive, THE Greeting_Widget SHALL display the text "Good evening".
4. WHILE the local time is from 21:00:00 through 23:59:59 inclusive or from 00:00:00 through 04:59:59 inclusive, THE Greeting_Widget SHALL display the text "Good night".
5. WHEN the local time crosses a greeting boundary, THE Greeting_Widget SHALL update the displayed greeting within one second.

### Requirement 3: Focus Timer Countdown

**User Story:** As a user, I want a 25-minute focus timer, so that I can work in focused intervals.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize to a countdown duration of 25 minutes and 0 seconds.
2. WHILE the Focus_Timer is running, THE Focus_Timer SHALL decrement the remaining time by one second each second.
3. WHILE the Focus_Timer is running, THE Focus_Timer SHALL display the remaining time in MM:SS format.
4. WHEN the remaining time reaches zero, THE Focus_Timer SHALL stop the countdown such that the displayed time remains at 00:00 and does not decrement further.
5. WHEN the remaining time reaches zero, THE Focus_Timer SHALL display a visible message indicating that the focus session has ended.

### Requirement 4: Focus Timer Controls

**User Story:** As a user, I want to start, stop, and reset the focus timer, so that I can control my focus sessions.

#### Acceptance Criteria

1. WHEN the user activates the start control, THE Focus_Timer SHALL begin the countdown from the currently displayed remaining time.
2. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown and retain the remaining time on the display.
3. WHEN the user activates the reset control, THE Focus_Timer SHALL restore the remaining time to 25 minutes and 0 seconds and stop the countdown.
4. WHILE the Focus_Timer is running, THE Focus_Timer SHALL disable the start control and enable the stop and reset controls.
5. WHILE the Focus_Timer is not running, THE Focus_Timer SHALL enable the start control, disable the stop control, and enable the reset control.

### Requirement 5: Add Tasks

**User Story:** As a user, I want to add tasks to my to-do list, so that I can track what I need to do.

#### Acceptance Criteria

1. WHEN the user submits text through the Task_Entry that is non-empty after trimming leading and trailing whitespace, THE Task_List SHALL append a new Task storing the trimmed text with a completion status of not done.
2. IF the user submits text through the Task_Entry that is empty after trimming leading and trailing whitespace, THEN THE Task_List SHALL reject the submission and display no new Task.
3. WHEN a new Task is appended, THE Task_List SHALL display the new Task at the bottom of the list.
4. WHEN a new Task is appended, THE Task_Entry SHALL clear its input field.

### Requirement 6: Edit Tasks

**User Story:** As a user, I want to edit existing tasks, so that I can correct or refine what I need to do.

#### Acceptance Criteria

1. WHEN the user activates the edit control for a Task, THE Task_List SHALL allow the user to edit the Task text in place, retaining the Task's current position in the Task_List and starting from the Task's existing text.
2. WHEN the user saves an edited Task with non-empty text (text containing at least one non-whitespace character), THE Task_List SHALL update the Task text to the edited value and preserve the Task completion status.
3. IF the user saves an edited Task with empty or whitespace-only text, THEN THE Task_List SHALL reject the change and keep the previous Task text.
4. IF the user cancels an in-progress Task edit by activating the cancel control or pressing the Escape key, THEN THE Task_List SHALL discard the edit and keep the previous Task text.

### Requirement 7: Mark Tasks as Done

**User Story:** As a user, I want to mark tasks as done, so that I can see what I have completed.

#### Acceptance Criteria

1. WHEN the user toggles the completion control for a Task, THE Task_List SHALL reverse the Task completion status, switching between done and not done on each toggle.
2. WHILE a Task is in done status, THE Task_List SHALL display the Task with strikethrough text decoration to distinguish it from Tasks that are not done.

### Requirement 8: Delete Tasks

**User Story:** As a user, I want to delete tasks, so that I can remove items I no longer need.

#### Acceptance Criteria

1. WHEN the user activates the delete control for a Task, THE Task_List SHALL immediately remove the Task from the displayed list.
2. WHEN a Task is deleted, THE Task_List SHALL update Local_Storage so that only the remaining Tasks are persisted.
3. WHEN the page is reloaded after a Task is deleted, THE Task_List SHALL NOT display the deleted Task.

### Requirement 9: Task List Persistence

**User Story:** As a user, I want my tasks saved between sessions, so that I do not lose them when I close the browser.

#### Acceptance Criteria

1. WHEN a Task is added, edited, marked, or deleted, THE Task_List SHALL save the current Task list to Local_Storage, including the text and completion status of each Task, in the order the Tasks appear in the list.
2. WHEN the Dashboard loads, THE Task_List SHALL load Tasks from Local_Storage and display them in the saved order.
3. WHEN the Dashboard loads with no Tasks in Local_Storage, THE Task_List SHALL display an empty list.
4. WHEN the Dashboard is reloaded and Tasks have previously been saved to Local_Storage, THE Task_List SHALL restore a Task list having the same Tasks with the same text, the same completion status, and in the same order as the previously saved list (round-trip property).
5. IF Local_Storage contains data that cannot be read as a Task list when the Dashboard loads, THEN THE Task_List SHALL display an empty list.

### Requirement 10: Quick Links Display and Navigation

**User Story:** As a user, I want buttons that open my favorite websites, so that I can reach them quickly.

#### Acceptance Criteria

1. THE Quick_Links_Widget SHALL render exactly one button for each saved Quick_Link.
2. WHEN the user activates a Quick_Link button, THE Quick_Links_Widget SHALL open the URL of that Quick_Link in a new browser tab.
3. THE Quick_Links_Widget SHALL display the display name of each Quick_Link as the label of its button.
4. WHEN the user submits a non-empty display name and a non-empty URL through the Quick_Link add control, THE Quick_Links_Widget SHALL append a new Quick_Link with the submitted display name and URL and render a button for it.
5. IF the user submits an empty display name or an empty URL through the Quick_Link add control, THEN THE Quick_Links_Widget SHALL reject the submission and add no new Quick_Link.
6. WHEN the user activates the remove control for a Quick_Link, THE Quick_Links_Widget SHALL remove that Quick_Link and remove its button.

### Requirement 11: Quick Links Persistence

**User Story:** As a user, I want my quick links saved between sessions, so that I do not have to re-enter them.

#### Acceptance Criteria

1. WHEN a Quick_Link is added or removed, THE Quick_Links_Widget SHALL save the current Quick_Link list to Local_Storage, persisting the display name and URL of each Quick_Link.
2. WHEN the Dashboard loads, THE Quick_Links_Widget SHALL load Quick_Links from Local_Storage and render the corresponding buttons.
3. WHEN the Dashboard loads with no Quick_Links in Local_Storage, THE Quick_Links_Widget SHALL render no Quick_Link buttons.
4. FOR ALL Quick_Link lists saved to Local_Storage, WHEN the Dashboard is reloaded, THE Quick_Links_Widget SHALL restore a Quick_Link list equivalent to the saved list, where each restored Quick_Link has the same display name and URL as the saved one and the list preserves the saved order (round-trip property).
5. IF the Dashboard loads and the Quick_Links value in Local_Storage is not a valid Quick_Link list, THEN THE Quick_Links_Widget SHALL render no Quick_Link buttons without preventing the Dashboard from loading the remaining widgets.

### Requirement 12: Client-Side Data Storage

**User Story:** As a developer, I want all data stored on the client, so that the Dashboard runs without a backend server.

#### Acceptance Criteria

1. THE Dashboard SHALL store all persistent data using Local_Storage.
2. THE Dashboard SHALL store and retrieve all persistent data without using a backend server, network requests, or cookies.
3. THE Dashboard SHALL store Tasks and Quick_Links under two distinct Local_Storage keys, using a different key name for Tasks than for Quick_Links.

### Requirement 13: Browser Compatibility

**User Story:** As a user, I want the Dashboard to run in my browser, so that I can use it regardless of browser choice.

#### Acceptance Criteria

1. THE Dashboard SHALL render all interface elements and execute all defined features using standard web APIs supported by each Modern_Browser, without relying on browser-specific vendor prefixes.
2. WHERE the Dashboard is installed as a browser extension, THE Dashboard SHALL provide the same features, the same Local Storage data persistence, and the same rendering as the standalone web app.

### Requirement 14: Performance

**User Story:** As a user, I want the Dashboard to respond immediately, so that interaction feels instant.

#### Acceptance Criteria

1. WHEN the Dashboard loads in a Modern_Browser, THE Dashboard SHALL display all widgets within one second.
2. WHEN the user updates Tasks or Quick_Links, THE Dashboard SHALL reflect the change in the affected widget within 100 milliseconds.

### Requirement 15: Visual Design

**User Story:** As a user, I want a clean, readable interface, so that I can use the Dashboard without effort.

#### Acceptance Criteria

1. THE Dashboard SHALL display no content elements other than the Greeting_Widget, Focus_Timer, Task_List, and Quick_Links_Widget and their associated controls.
2. THE Dashboard SHALL render the Greeting_Widget, Focus_Timer, Task_List, and Quick_Links_Widget with at least 16 pixels of spacing between any two adjacent widgets.
3. THE Dashboard SHALL render all text within the Greeting_Widget, Focus_Timer, Task_List, and Quick_Links_Widget at a minimum font size of 16 pixels.
4. THE Dashboard SHALL render all widget text with a contrast ratio of at least 4.5 to 1 against its background.

### Requirement 16: File Organization

**User Story:** As a developer, I want a simple, predictable project structure, so that the code is easy to read and maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL contain exactly one CSS file, named style.css, located in a css directory.
2. THE Dashboard SHALL contain exactly one JavaScript file, named app.js, located in a js directory.
3. THE Dashboard SHALL use vanilla JavaScript with no frontend frameworks.
4. THE Dashboard SHALL load the single CSS file and the single JavaScript file from a single HTML entry point named index.html.

### Requirement 17: Deployment via GitHub Pages

**User Story:** As a developer, I want to publish the Dashboard through GitHub Pages, so that anyone can access it.

#### Acceptance Criteria

1. WHEN the Dashboard files are pushed to the GitHub repository main branch, THE Dashboard SHALL be accessible at the GitHub Pages URL with the single HTML entry point served from the repository root and no build step required.
2. WHEN deployed through GitHub Pages, THE Dashboard SHALL load the single HTML entry point, the single CSS file, and the single JavaScript file using relative paths.
3. WHEN deployed through GitHub Pages, THE Dashboard SHALL operate all widgets without additional server configuration.
