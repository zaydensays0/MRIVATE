# **App Name**: File Cloaker

## Core Features:

- File Selection Button: Provide a 'Hide File' button to initiate the file import process using Storage Access Framework.
- File Selection: Utilize Storage Access Framework (Intent.ACTION_OPEN_DOCUMENT) to allow users to select photos, videos, or files.
- File Copy: Copy the selected file to the app's private internal storage (getFilesDir() or getExternalFilesDir()).
- Original File Deletion: After successful copy, delete the original file from its public location using MediaStore.createDeleteRequest() or contentResolver.delete().
- Hidden File List: Display a ListView or RecyclerView showing the hidden files for management.
- Status Notifications: Show toast messages for successful import and deletion operations.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) for a secure and reliable feel.
- Background color: Light gray (#F0F0F0) for a clean and neutral interface.
- Accent color: Soft Lavender (#E6E6FA) for highlights and button interaction.
- Body and headline font: 'Inter', sans-serif, for a modern and clean UI.