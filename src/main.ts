import { formattingCommand } from "./commands/formatting";
import { goToDefinition } from "./commands/goToDefinition";

let langClient = null;

export const activate = function () {
  nova.config.observe("elixir-ls.language-server-path", function (
    path: string
  ) {
    startServer(path);
  });
};

export const deactivate = function () {
  stopServer();
};

const startServer = (path: string) => {
  if (langClient) {
    langClient.stop();
    nova.subscriptions.remove(langClient);
  }

  // Use the default server path
  if (!path) {
    path = nova.extension.path + "/elixir-ls-release/language_server.sh";
  }

  // Create the client
  const serverOptions = {
    path: path,
  };
  const clientOptions = {
    // The set of document syntaxes for which the server is valid
    syntaxes: ["elixir"],
  };
  const client: any = new LanguageClient(
    "elixir-ls-langserver",
    "Elixir Language Server",
    serverOptions,
    clientOptions
  );

  try {
    // Start the client
    client.start();

    // Add the client to the subscriptions to be cleaned up
    nova.subscriptions.add(client);
    langClient = client;

    nova.commands.register(
      "raulchedrese.elixir-ls.goToDefinition",
      (editor) => {
        goToDefinition(client, editor);
      }
    );

    // Format on Save
    nova.workspace.onDidAddTextEditor((editor) => {
      editor.onWillSave((editor) => {
        formattingCommand(client, editor);
      });
    });
  } catch (err) {
    // If the .start() method throws, it's likely because the path to the language server is invalid

    if (nova.inDevMode()) {
      console.error(err);
    }
  }
};

const stopServer = () => {
  if (langClient) {
    langClient.stop();
    nova.subscriptions.remove(langClient);
    langClient = null;
  }
};
