{
  inputs = {
    utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, utils }: utils.lib.eachDefaultSystem (system:
    let
      pkgs = nixpkgs.legacyPackages.${system};
      
      claude-sync = pkgs.stdenv.mkDerivation {
        pname = "claude-sync";
        version = "1.0.0";
        
        src = ./.;
        
        buildInputs = [ pkgs.nodejs ];
        
        installPhase = ''
          runHook preInstall
          
          mkdir -p $out/bin $out/lib/claude-sync
          
          # Copy all source files
          cp -r src $out/lib/claude-sync/
          cp cli.js package.json $out/lib/claude-sync/
          
          # Create the executable wrapper
          cat > $out/bin/claude-sync << EOF
          #!${pkgs.bash}/bin/bash
          exec ${pkgs.nodejs}/bin/node $out/lib/claude-sync/cli.js "\$@"
          EOF
          
          chmod +x $out/bin/claude-sync
          
          runHook postInstall
        '';
        
        meta = with pkgs.lib; {
          description = "CLI tool to watch and parse Claude's JSONL conversation logs";
          license = licenses.mit;
          maintainers = [ ];
        };
      };
    in
    {
      packages = {
        default = claude-sync;
        claude-sync = claude-sync;
      };
      
      apps = {
        check = {
          type = "app";
          program = "${pkgs.writeShellScript "flake-check" ''
            export NIXPKGS_ALLOW_UNFREE=1
            ${pkgs.nix}/bin/nix flake check --impure
          ''}";
        };
        
        check-all = {
          type = "app";
          program = "${pkgs.writeShellScript "flake-check-all" ''
            export NIXPKGS_ALLOW_UNFREE=1
            ${pkgs.nix}/bin/nix flake check --impure --all-systems
          ''}";
        };
        
        build-test = {
          type = "app";
          program = "${pkgs.writeShellScript "build-test" ''
            echo "Testing package builds..."
            ${pkgs.nix}/bin/nix build .#default
            ${pkgs.nix}/bin/nix build .#claude-sync
            echo "Testing package runs..."
            ${pkgs.nix}/bin/nix run .#claude-sync -- --help
            echo "All tests passed!"
          ''}";
        };
      };
      
      devShells.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          gh
          git
          claude-code
          nodejs
          jq
        ];
      };
    }
  );
}
